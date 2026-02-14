import { expect } from "@playwright/test";
import { test } from "./fixtures/auth.fixture";

test.describe("Annual Charges", () => {
  test.describe.configure({ mode: "serial" });

  const timestamp = Date.now();
  const entityName = `E2E Charges ${timestamp}`;
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

  test("navigate to charges page from sidebar", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: "Charges" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Charges" }).click();
    await expect(page).toHaveURL("/charges", { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible();
  });

  test("enter charges and verify display", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill fixed categories
    await page.getByLabel("Eau").fill("500");
    await page.getByLabel("Électricité").fill("300");
    await page.getByLabel("TEOM").fill("200");
    await page.getByLabel("Nettoyage").fill("100");

    // Submit
    await page
      .getByRole("button", { name: "Enregistrer les charges" })
      .click();

    // Verify success message (optimistic update)
    await expect(
      page.getByText("Charges enregistrées avec succès."),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("add custom category and submit", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for existing data to load
    await expect(page.getByLabel("Eau")).toHaveValue("500", {
      timeout: 10_000,
    });

    // Add custom category
    await page
      .getByRole("button", { name: "Ajouter une catégorie" })
      .click();

    await page
      .getByLabel("Libellé catégorie personnalisée 1")
      .fill("Gardiennage");
    await page
      .getByLabel("Montant catégorie personnalisée 1")
      .clear();
    await page
      .getByLabel("Montant catégorie personnalisée 1")
      .fill("150");

    // Submit
    await page
      .getByRole("button", { name: "Enregistrer les charges" })
      .click();

    await expect(
      page.getByText("Charges enregistrées avec succès."),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("re-submit overwrites existing charges", async ({ page }) => {
    test.skip(!entityId, "Requires entity from seed test");

    await page.goto("/charges");
    await expect(
      page.getByRole("heading", { name: "Charges annuelles" }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for existing data to load
    await expect(page.getByLabel("Eau")).toHaveValue("500", {
      timeout: 10_000,
    });

    // Change water amount
    await page.getByLabel("Eau").clear();
    await page.getByLabel("Eau").fill("600");

    // Submit
    await page
      .getByRole("button", { name: "Enregistrer les charges" })
      .click();

    await expect(
      page.getByText("Charges enregistrées avec succès."),
    ).toBeVisible({ timeout: 10_000 });

    // Reload and verify updated value
    await page.reload();
    await expect(page.getByLabel("Eau")).toHaveValue("600", {
      timeout: 10_000,
    });
  });
});
