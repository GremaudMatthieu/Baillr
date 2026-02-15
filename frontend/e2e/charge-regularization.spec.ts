import { test, expect } from "./fixtures/auth.fixture";
import { ApiHelper } from "./fixtures/api.fixture";
import { randomUUID } from "node:crypto";

test.describe("Charge Regularization", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  let api: ApiHelper;
  let entityId: string;
  let tenantId1: string;
  let leaseId1: string;
  let leaseId2: string;

  test("seed — create full scenario via API", async ({ page, request }) => {
    // Get Clerk token
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? "";
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    // 1. Create entity
    entityId = await api.createEntity({
      name: `Régul E2E ${timestamp}`,
      email: `regul-${timestamp}@example.com`,
    });
    await api.waitForEntityCount(1);

    // 2. Create property
    const propertyId = await api.createProperty({
      entityId,
      name: `Immeuble ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // 3. Create 2 units
    const unitId1 = await api.createUnit({
      propertyId,
      identifier: `Apt 1A ${timestamp}`,
      surfaceArea: 45,
    });
    const unitId2 = await api.createUnit({
      propertyId,
      identifier: `Apt 2B ${timestamp}`,
      surfaceArea: 60,
    });
    await api.waitForUnitCount(propertyId, 2);

    // 4. Register 2 tenants
    tenantId1 = await api.registerTenant({
      entityId,
      firstName: "Jean",
      lastName: "Dupont",
      email: `dupont-${timestamp}@example.com`,
    });
    const tenantId2 = await api.registerTenant({
      entityId,
      firstName: "Marie",
      lastName: "Martin",
      email: `martin-${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 2);

    // 5. Create 2 leases (start date in previous year)
    const fiscalYear = new Date().getFullYear() - 1;
    leaseId1 = await api.createLease({
      entityId,
      tenantId: tenantId1,
      unitId: unitId1,
      startDate: `${fiscalYear}-01-01T00:00:00.000Z`,
      rentAmountCents: 50000,
    });
    leaseId2 = await api.createLease({
      entityId,
      tenantId: tenantId2,
      unitId: unitId2,
      startDate: `${fiscalYear}-01-01T00:00:00.000Z`,
      rentAmountCents: 60000,
    });
    await api.waitForLeaseCount(entityId, 2);

    // 6. Get charge categories
    const { data: categories } = await api.getChargeCategories(entityId);
    const waterCat = categories.find(
      (c) => (c as Record<string, unknown>).slug === "water",
    ) as Record<string, unknown> | undefined;
    const teomCat = categories.find(
      (c) => (c as Record<string, unknown>).slug === "teom",
    ) as Record<string, unknown> | undefined;

    // 7. Configure billing lines for both leases (provisions)
    if (waterCat && teomCat) {
      await api.configureBillingLines(leaseId1, [
        {
          chargeCategoryId: waterCat.id as string,
          amountCents: 2500,
        },
        {
          chargeCategoryId: teomCat.id as string,
          amountCents: 1500,
        },
      ]);
      await api.configureBillingLines(leaseId2, [
        {
          chargeCategoryId: waterCat.id as string,
          amountCents: 3000,
        },
        {
          chargeCategoryId: teomCat.id as string,
          amountCents: 2000,
        },
      ]);
    }

    // 8. Record annual charges
    const chargesId = randomUUID();
    const charges: {
      chargeCategoryId: string;
      label: string;
      amountCents: number;
    }[] = [];
    if (waterCat) {
      charges.push({
        chargeCategoryId: waterCat.id as string,
        label: "Eau",
        amountCents: 80000,
      });
    }
    if (teomCat) {
      charges.push({
        chargeCategoryId: teomCat.id as string,
        label: "TEOM",
        amountCents: 50000,
      });
    }
    await api.recordAnnualCharges(entityId, {
      id: chargesId,
      fiscalYear,
      charges,
    });

    // Allow projections to settle
    await new Promise((r) => setTimeout(r, 1000));
  });

  test("navigate to charges page and see regularization section", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires seed");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    const fiscalYear = new Date().getFullYear() - 1;

    // Regularization section should be visible
    await expect(
      page.getByText(`Régularisation des charges — ${fiscalYear}`),
    ).toBeVisible({ timeout: 10_000 });

    // Empty state before generation
    await expect(
      page.getByText("Aucune régularisation calculée pour cet exercice."),
    ).toBeVisible();

    // Generate button should be present
    await expect(
      page.getByRole("button", { name: /Générer la régularisation/i }),
    ).toBeVisible();
  });

  test("generate regularization and verify statements", async ({ page }) => {
    test.skip(!entityId, "Requires seed");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Click generate trigger to open AlertDialog
    await page
      .getByRole("button", { name: /Générer la régularisation/i })
      .click();

    // Confirm in AlertDialog
    await page.getByRole("button", { name: "Générer" }).click();

    // Wait for results — statements should appear
    await expect(page.getByText(/2 locataires/)).toBeVisible({
      timeout: 15_000,
    });

    // Verify tenant names appear (lastName firstName — French convention)
    await expect(page.getByText(/Dupont Jean/)).toBeVisible();
    await expect(page.getByText(/Martin Marie/)).toBeVisible();
    // Note: formatTenantName produces "lastName firstName" so these match

    // Verify balance badges exist (either Complément or Trop-perçu)
    const complementBadges = page.getByText("Complément");
    const tropPercuBadges = page.getByText("Trop-perçu");
    const soldeNulBadges = page.getByText("Solde nul");

    const badgeCount =
      (await complementBadges.count()) +
      (await tropPercuBadges.count()) +
      (await soldeNulBadges.count());
    expect(badgeCount).toBeGreaterThanOrEqual(2); // At least one badge per tenant
  });

  test("download regularization PDF", async ({ page }) => {
    test.skip(!entityId || !leaseId1, "Requires seed");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for regularization data to load
    await expect(page.getByText(/2 locataires/)).toBeVisible({
      timeout: 15_000,
    });

    // Click first PDF download button
    const downloadPromise = page.waitForEvent("download");
    const downloadButtons = page.getByRole("button", {
      name: /Télécharger PDF/i,
    });
    await downloadButtons.first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /regularisation-charges-.*\.pdf$/,
    );
  });

  test("apply regularization and verify badge", async ({ page }) => {
    test.skip(!entityId, "Requires seed");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for regularization data to load
    await expect(page.getByText(/2 locataires/)).toBeVisible({
      timeout: 15_000,
    });

    // "Appliquer" button should be visible (not yet applied)
    await expect(
      page.getByRole("button", { name: /Appliquer/ }),
    ).toBeVisible();

    // Click apply trigger to open AlertDialog
    await page.getByRole("button", { name: /Appliquer/ }).click();

    // Verify AlertDialog content
    await expect(
      page.getByText(/Cette action est irréversible/),
    ).toBeVisible();

    // Confirm in AlertDialog
    await page.getByRole("button", { name: "Appliquer" }).click();

    // Wait for "Déjà appliquée" badge to appear
    await expect(page.getByText("Déjà appliquée")).toBeVisible({
      timeout: 15_000,
    });

    // "Appliquer" button should no longer exist
    await expect(
      page.getByRole("button", { name: /Appliquer/ }),
    ).not.toBeVisible();
  });

  test("verify regularization entry on tenant detail page", async ({ page }) => {
    test.skip(!entityId || !tenantId1, "Requires seed + apply");

    await page.goto(`/tenants/${tenantId1}`);

    // Wait for tenant page to load
    await expect(page.getByText("Compte courant")).toBeVisible({
      timeout: 10_000,
    });

    const fiscalYear = new Date().getFullYear() - 1;

    // Verify regularization account entry appears in the tenant's current account table
    await expect(
      page.getByText(new RegExp(`Régularisation des charges — ${fiscalYear}`)),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("re-apply is blocked — badge persists on reload", async ({ page }) => {
    test.skip(!entityId, "Requires seed");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for regularization data
    await expect(page.getByText(/2 locataires/)).toBeVisible({
      timeout: 15_000,
    });

    // Badge should still show "Déjà appliquée"
    await expect(page.getByText("Déjà appliquée")).toBeVisible();

    // "Appliquer" button should not be present
    await expect(
      page.getByRole("button", { name: /Appliquer/ }),
    ).not.toBeVisible();
  });
});
