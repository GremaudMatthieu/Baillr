import { test, expect } from './fixtures/auth.fixture';

test.describe('Water Meter Readings', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let propertyId: string;

  test('seed — create entity, property and unit via UI', async ({ page }) => {
    // Create entity
    await page.goto('/entities/new');
    const entityName = `Water E2E ${timestamp}`;
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.getByLabel('SIRET').fill('11111111111111');

    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('1 rue de la Paix Paris');
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
    expect(entityId).toBeTruthy();

    // Create property
    await page.goto('/properties/new');
    const propertyName = `Water Property ${timestamp}`;
    await page.getByLabel('Nom du bien').fill(propertyName);

    const addressInput2 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput2.fill('10 avenue des Champs-Élysées Paris');
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

    // Create unit A
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Apt A ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('45');
    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));

    // Create unit B
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Apt B ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('60');
    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));
  });

  test('water meter readings card should appear when units exist', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/charges');
    await expect(
      page.getByRole('heading', { name: 'Charges annuelles' }),
    ).toBeVisible({ timeout: 10_000 });

    // Water meter readings card should appear since units exist
    const currentYear = new Date().getFullYear() - 1;
    await expect(
      page.getByText(`Relevés de compteurs d'eau — Exercice ${currentYear}`),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('enter water meter readings for units', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/charges');
    await expect(
      page.getByRole('heading', { name: 'Charges annuelles' }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for units to load and form to appear
    await expect(
      page.getByRole('button', { name: 'Enregistrer les relevés' }),
    ).toBeVisible({ timeout: 10_000 });

    // Fill readings for unit A
    const previousA = page.getByLabelText(new RegExp(`Ancien relevé.*Apt A`));
    const currentA = page.getByLabelText(new RegExp(`Nouveau relevé.*Apt A`));
    await previousA.fill('100');
    await currentA.fill('150');

    // Fill readings for unit B
    const previousB = page.getByLabelText(new RegExp(`Ancien relevé.*Apt B`));
    const currentB = page.getByLabelText(new RegExp(`Nouveau relevé.*Apt B`));
    await previousB.fill('200');
    await currentB.fill('280');

    // Submit
    await page
      .getByRole('button', { name: 'Enregistrer les relevés' })
      .click();

    // Verify success
    await expect(
      page.getByText('Relevés enregistrés avec succès.'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('re-submit readings overwrites existing', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/charges');
    await expect(
      page.getByRole('button', { name: 'Enregistrer les relevés' }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for existing data to load
    const previousA = page.getByLabelText(new RegExp(`Ancien relevé.*Apt A`));
    await expect(previousA).toHaveValue('100', { timeout: 10_000 });

    // Update reading
    const currentA = page.getByLabelText(new RegExp(`Nouveau relevé.*Apt A`));
    await currentA.clear();
    await currentA.fill('200');

    // Submit
    await page
      .getByRole('button', { name: 'Enregistrer les relevés' })
      .click();

    await expect(
      page.getByText('Relevés enregistrés avec succès.'),
    ).toBeVisible({ timeout: 10_000 });
  });
});
