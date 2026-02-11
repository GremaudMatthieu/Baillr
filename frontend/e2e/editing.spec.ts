import { test, expect } from './fixtures/auth.fixture';

test.describe('Editing scenarios', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let propertyId: string;
  let unitId: string;

  test('4.1 — seed test data via UI', async ({ page }) => {
    // Create entity
    await page.goto('/entities/new');
    const entityName = `Edit Entity ${timestamp}`;
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.getByLabel('SIRET').fill('98765432109876');

    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('20 rue de Rivoli Paris');
    const listbox = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });
    await listbox.getByRole('option').first().click();

    await page.getByRole('button', { name: "Créer l'entité" }).click();
    await expect(page).toHaveURL('/entities');
    await expect(page.getByText(entityName)).toBeVisible();

    // Get entity ID
    await page.getByText(entityName).first().click();
    await page.waitForURL(/\/entities\/[\w-]+\/edit/);
    entityId = page.url().match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? '';

    // Go back and create property
    await page.goto('/properties/new');
    const propertyName = `Edit Property ${timestamp}`;
    await page.getByLabel('Nom du bien').fill(propertyName);

    const addressInput2 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput2.fill('5 place de la Concorde Paris');
    const listbox2 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await listbox2.waitFor({ state: 'visible', timeout: 10_000 });
    await listbox2.getByRole('option').first().click();

    await page.getByRole('button', { name: 'Créer le bien' }).click();
    await expect(page).toHaveURL('/properties');

    // Get property ID
    await page.getByText(propertyName).first().click();
    await page.waitForURL(/\/properties\/[\w-]+/);
    propertyId = page.url().match(/\/properties\/([\w-]+)/)?.[1] ?? '';

    // Create unit
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Unit Edit ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('50');

    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));

    // Get unit ID from the unit link
    const unitLink = page.getByText(`Unit Edit ${timestamp}`).first();
    await unitLink.click();
    await page.waitForURL(/\/units\/[\w-]+/);
    unitId = page.url().match(/\/units\/([\w-]+)/)?.[1] ?? '';
  });

  test('4.2 — edit entity name and verify in EntitySwitcher', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    const updatedName = `Updated Entity ${timestamp}`;
    await page.goto(`/entities/${entityId}/edit`);

    // Clear and update name
    await page.getByLabel("Nom de l'entité").fill(updatedName);

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Should redirect to entities list
    await expect(page).toHaveURL('/entities');

    // Entity name should be updated
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('4.3 — edit property name and verify in list', async ({ page }) => {
    test.skip(!propertyId, 'Requires property from seed test');

    const updatedPropertyName = `Updated Property ${timestamp}`;
    await page.goto(`/properties/${propertyId}`);

    // Click edit button (inline editing — no separate /edit route)
    await page.getByRole('button', { name: /modifier/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Modifier le bien' }),
    ).toBeVisible();

    // Update name
    await page.getByLabel('Nom du bien').fill(updatedPropertyName);

    // Submit — form calls router.back() after save
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Navigate to properties list to verify the update persisted
    await page.goto('/properties');
    await expect(page.getByText(updatedPropertyName)).toBeVisible();
  });

  test('4.4 — edit unit surface and verify changes', async ({ page }) => {
    test.skip(!propertyId || !unitId, 'Requires unit from seed test');

    await page.goto(`/properties/${propertyId}/units/${unitId}`);

    // Click edit button (inline editing — no separate /edit route)
    await page.getByRole('button', { name: /modifier/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Modifier le lot' }),
    ).toBeVisible();

    // Update surface
    await page.getByLabel('Surface (m²)').fill('75.5');

    // Add a billable option
    await page.getByRole('button', { name: 'Ajouter une option' }).click();
    const billableLabel = page.getByPlaceholder('Ex : Entretien chaudière');
    await billableLabel.last().fill('Charges communes');
    const billableAmount = page.locator('input[type="number"][step="0.01"]');
    await billableAmount.last().fill('50.00');

    // Submit — form calls router.back() after save
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Navigate back to unit detail to verify changes persisted
    await page.goto(`/properties/${propertyId}/units/${unitId}`);
    await expect(page.getByText('75.5 m²')).toBeVisible();
    await expect(page.getByText('Charges communes')).toBeVisible();
  });
});
