import { expect } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";

test.describe("Revisions", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const entityName = `E2E Rev ${timestamp}`;
  let entityId: string;

  test("seed — create entity + property + unit + tenant + lease (with revision params) + record INSEE index", async ({
    page,
  }) => {
    // 1. Create entity
    await page.goto("/entities/new");
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.locator("[id='type']").first().click();
    await page.getByRole("option", { name: "Nom propre" }).click();
    const addressInput = page.getByRole("combobox", {
      name: "Rechercher une adresse",
    });
    await addressInput.fill("1 rue de la Paix Paris");
    const listbox = page.getByRole("listbox", {
      name: "Suggestions d'adresses",
    });
    await listbox.waitFor({ state: "visible", timeout: 10_000 });
    await listbox.getByRole("option").first().click();
    await page.getByRole("button", { name: "Créer l'entité" }).click();
    await page.waitForURL(/\/entities\/[\w-]+\/edit/, { timeout: 10_000 });
    entityId = page.url().match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? "";
    expect(entityId).toBeTruthy();

    // 2. Create property
    await page.goto("/properties/new");
    await page.getByLabel("Nom du bien").fill(`Prop Rev ${timestamp}`);
    const propAddr = page.getByRole("combobox", {
      name: "Rechercher une adresse",
    });
    await propAddr.fill("10 avenue des Champs-Élysées Paris");
    const propListbox = page.getByRole("listbox", {
      name: "Suggestions d'adresses",
    });
    await propListbox.waitFor({ state: "visible", timeout: 10_000 });
    await propListbox.getByRole("option").first().click();
    await page.getByRole("button", { name: "Créer le bien" }).click();
    await page.waitForURL(/\/properties\/[\w-]+/, { timeout: 10_000 });

    // 3. Create unit
    const propertyUrl = page.url();
    const propertyId =
      propertyUrl.match(/\/properties\/([\w-]+)/)?.[1] ?? "";
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel("Identifiant du lot").fill(`UnitRev ${timestamp}`);
    await page.locator("[id='type']").first().click();
    await page.getByRole("option", { name: "Appartement" }).click();
    await page.getByLabel("Surface (m²)").fill("45");
    await page.getByRole("button", { name: "Créer le lot" }).click();
    await page.waitForURL(/\/properties\/[\w-]+\/units\/[\w-]+/, {
      timeout: 10_000,
    });

    // 4. Create tenant
    await page.goto("/tenants/new");
    await page.getByLabel("Prénom").fill("Jean");
    await page.getByLabel("Nom").fill(`Revision ${timestamp}`);
    await page.getByLabel("Email").fill(`rev-${timestamp}@test.com`);
    await page.getByRole("button", { name: "Créer le locataire" }).click();
    await page.waitForURL(/\/tenants\/[\w-]+/, { timeout: 10_000 });

    // 5. Create lease
    await page.goto("/leases/new");
    // Select tenant
    await page.locator("[id='tenantId']").first().click();
    await page
      .getByRole("option", { name: new RegExp(`Revision ${timestamp}`) })
      .click();
    // Select unit
    await page.locator("[id='unitId']").first().click();
    await page
      .getByRole("option", { name: new RegExp(`UnitRev ${timestamp}`) })
      .click();
    // Set rent and dates
    await page.getByLabel("Loyer mensuel (€)").fill("750");
    await page.getByLabel("Dépôt de garantie (€)").fill("750");
    // Select revision index type
    await page.locator("[id='revisionIndexType']").first().click();
    await page.getByRole("option", { name: "IRL" }).click();
    await page.getByRole("button", { name: "Créer le bail" }).click();
    await page.waitForURL(/\/leases\/[\w-]+/, { timeout: 10_000 });

    // 6. Configure revision parameters on the lease
    const leaseUrl = page.url();
    const leaseId = leaseUrl.match(/\/leases\/([\w-]+)/)?.[1] ?? "";
    await page.goto(`/leases/${leaseId}`);
    // Click "Configurer" for revision parameters
    const configButton = page.getByRole("button", {
      name: /configurer les paramètres/i,
    });
    const hasConfigButton = await configButton
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (hasConfigButton) {
      await configButton.click();
      // Fill revision form fields
      const daySelect = page.locator("[id='revisionDay']");
      if (await daySelect.isVisible().catch(() => false)) {
        await daySelect.click();
        await page.getByRole("option", { name: "1" }).first().click();
      }
      const monthSelect = page.locator("[id='revisionMonth']");
      if (await monthSelect.isVisible().catch(() => false)) {
        await monthSelect.click();
        await page.getByRole("option", { name: /janvier/i }).click();
      }
      const quarterSelect = page.locator("[id='referenceQuarter']");
      if (await quarterSelect.isVisible().catch(() => false)) {
        await quarterSelect.click();
        await page.getByRole("option", { name: "Q1" }).click();
      }
      await page.getByLabel(/année/i).fill("2025");
      await page.getByLabel(/valeur.*indice/i).fill("138.19");
      await page.getByRole("button", { name: /enregistrer/i }).click();
      await expect(page.getByText("138.19")).toBeVisible({ timeout: 10_000 });
    }

    // 7. Record matching INSEE index
    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });
    // The index form defaults to IRL, Q1, current year — we need Q1 2025 to match
    const yearInput = page.getByLabel("Année");
    await yearInput.clear();
    await yearInput.fill("2025");
    await page.getByLabel("Valeur").fill("142.06");
    await page
      .getByRole("button", { name: "Enregistrer l'indice" })
      .click();
    await expect(page.getByText("142.06")).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to revisions page and verify empty state", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires seed data");

    await page.goto("/revisions");
    await expect(
      page.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("Aucune révision en attente."),
    ).toBeVisible();
  });

  test("trigger batch calculation and verify revision in table", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires seed data");

    await page.goto("/revisions");
    await expect(
      page.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeVisible({ timeout: 10_000 });

    // Click calculate button
    await page
      .getByRole("button", { name: /calculer les révisions/i })
      .click();

    // Confirm in dialog
    await expect(
      page.getByText("Calculer les révisions de loyer"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Calculer" }).click();

    // Wait for result summary
    await expect(page.getByText("Résultat du calcul")).toBeVisible({
      timeout: 10_000,
    });

    // Close dialog
    await page.getByRole("button", { name: "Fermer" }).click();

    // Verify revision in table (allow projection delay)
    await expect(page.locator("table").getByText("IRL")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("approve individual revision and verify status change", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires seed data");

    await page.goto("/revisions");
    await expect(
      page.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for table with pending revision
    await expect(page.getByText("En attente")).toBeVisible({
      timeout: 10_000,
    });

    // Select the first pending revision
    const checkbox = page
      .getByRole("checkbox")
      .filter({ hasNot: page.locator("[aria-label*='toutes']") })
      .first();
    await checkbox.check();

    // Click approve selection button
    await page
      .getByRole("button", { name: /approuver la sélection/i })
      .click();

    // Confirm in dialog
    await expect(
      page.getByText(/vous allez approuver/i),
    ).toBeVisible();
    await page.getByRole("button", { name: "Approuver" }).click();

    // Wait for success
    await expect(
      page.getByText(/approuvée.*avec succès/i),
    ).toBeVisible({ timeout: 10_000 });

    // Close dialog
    await page.getByRole("button", { name: "Fermer" }).click();

    // Verify status changed to approved (with projection delay)
    await expect(page.getByText("Approuvée")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("download revision letter for approved revision", async ({ page }) => {
    test.skip(!entityId, "Requires seed data");

    await page.goto("/revisions");
    await expect(
      page.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for approved revision to appear
    await expect(page.getByText("Approuvée")).toBeVisible({
      timeout: 10_000,
    });

    // Verify download button is visible for approved revision
    const downloadBtn = page.getByRole("button", {
      name: /télécharger la lettre de révision/i,
    });
    await expect(downloadBtn).toBeVisible();

    // Click and wait for download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click(),
    ]);

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toContain("lettre-revision");
    expect(suggestedFilename).toContain(".pdf");
  });

  test("download buttons match approved revision count", async ({ page }) => {
    test.skip(!entityId, "Requires seed data");

    await page.goto("/revisions");
    await expect(
      page.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeVisible({ timeout: 10_000 });

    // Count approved badges and download buttons — they should match
    const approvedBadges = page.getByText("Approuvée");
    const approvedCount = await approvedBadges.count();
    const downloadBtns = page.getByRole("button", {
      name: /télécharger la lettre de révision/i,
    });
    const downloadCount = await downloadBtns.count();
    expect(downloadCount).toBe(approvedCount);
  });

  test("sidebar navigation includes Révisions link", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: "Révisions" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Révisions" }).click();
    await expect(page).toHaveURL("/revisions", { timeout: 10_000 });
  });
});
