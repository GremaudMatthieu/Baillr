import { expect } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";

test.describe("INSEE Indices", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const entityName = `E2E Indices ${timestamp}`;
  let entityId: string;

  test("seed — create entity via UI", async ({ page }) => {
    await page.goto("/entities/new");

    await page.getByLabel("Nom de l'entité").fill(entityName);

    // Select type
    await page
      .locator("[id='type']")
      .first()
      .click();
    await page.getByRole("option", { name: "Nom propre" }).click();

    // Address autocomplete
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

    const url = page.url();
    entityId = url.match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? "";
    expect(entityId).toBeTruthy();
  });

  test("navigate to indices page", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify form is present
    await expect(page.getByLabel("Type d'indice")).toBeVisible();
    await expect(page.getByLabel("Trimestre")).toBeVisible();
    await expect(page.getByLabel("Année")).toBeVisible();
    await expect(page.getByLabel("Valeur")).toBeVisible();
  });

  test("record an INSEE index and verify in list", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill value field
    await page.getByLabel("Valeur").fill("142.06");

    // Submit form
    await page
      .getByRole("button", { name: "Enregistrer l'indice" })
      .click();

    // Verify index appears in list (optimistic update)
    await expect(page.getByText("142.06")).toBeVisible({ timeout: 10_000 });
  });

  test("prevents duplicate index submission (AC #6)", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for projection to catch up from previous test
    await expect(page.getByText("142.06")).toBeVisible({ timeout: 10_000 });

    // Attempt to record a duplicate (same type IRL, quarter Q1, year = current)
    await page.getByLabel("Valeur").fill("143.15");
    await page
      .getByRole("button", { name: "Enregistrer l'indice" })
      .click();

    // Verify duplicate error message from backend
    await expect(
      page.getByText(/existe déjà/),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("fetch INSEE indices from API and verify summary (AC #1, #2)", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });

    // Click fetch button
    await page
      .getByRole("button", { name: "Récupérer les indices INSEE" })
      .click();

    // Verify result summary appears (real API call — INSEE BDM is open)
    await expect(
      page.getByText(/nouveaux indices enregistrés/),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("verify auto source badge for fetched indices (AC #4)", async ({
    page,
  }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/indices");
    await expect(
      page.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for indices to load — should see "Auto" badges from previous fetch
    await expect(page.getByText("Auto").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sidebar navigation includes Indices link", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: "Indices" }),
    ).toBeVisible({ timeout: 10_000 });

    // Click and navigate
    await page.getByRole("link", { name: "Indices" }).click();
    await expect(page).toHaveURL("/indices", { timeout: 10_000 });
  });
});
