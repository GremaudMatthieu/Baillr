import { test, expect } from './fixtures/auth.fixture';

test.describe('Onboarding flow', () => {
  test.describe.configure({ mode: 'serial' });

  let entityId: string;
  let propertyId: string;
  const entityName = `E2E Test Entity ${Date.now()}`;
  const propertyName = `E2E Test Property ${Date.now()}`;
  const unitIdentifier = `Apt E2E-${Date.now()}`;

  test('3.1 — sign in and see dashboard with onboarding actions', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // ActionFeed should show onboarding actions when no entity exists
    await expect(
      page.getByText('Créez votre première entité propriétaire'),
    ).toBeVisible();
  });

  test('3.2 — create entity via onboarding action', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.getByText('Créez votre première entité propriétaire'),
    ).toBeVisible();

    // Click "Commencer" on the create entity action
    await page
      .locator('article')
      .filter({ hasText: 'Créez votre première entité propriétaire' })
      .getByRole('link', { name: 'Commencer' })
      .click();

    await expect(page).toHaveURL('/entities/new');

    // Fill entity form — type is already "SCI" by default
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.getByLabel('SIRET').fill('12345678901234');

    // Fill address via autocomplete
    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('1 rue de la Paix Paris');
    const listbox = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });
    await listbox.getByRole('option').first().click();

    // Verify address fields are populated (read-only)
    await expect(page.getByLabel('Rue')).not.toHaveValue('');

    // Submit
    await page.getByRole('button', { name: "Créer l'entité" }).click();

    // Should redirect to entities list
    await expect(page).toHaveURL('/entities');

    // Entity should appear in the list
    await expect(page.getByText(entityName)).toBeVisible();

    // Entity should appear in sidebar EntitySwitcher (may take a moment for context to update)
    // The entity switcher shows the entity name when only one entity exists
    await expect(page.getByText(entityName).first()).toBeVisible();

    // Capture entity ID from URL or API for later steps
    // Navigate to entity edit to get the ID from URL
    await page.getByText(entityName).first().click();
    await page.waitForURL(/\/entities\/[\w-]+\/edit/);
    const url = page.url();
    entityId = url.match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? '';
    expect(entityId).toBeTruthy();
  });

  test('3.3 — add bank account to entity', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from previous test');

    await page.goto(`/entities/${entityId}/bank-accounts`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Comptes bancaires' }),
    ).toBeVisible();

    // Click "Ajouter un compte"
    await page.getByRole('button', { name: 'Ajouter un compte' }).click();

    // Form should appear with "Ajouter un compte" heading
    await expect(
      page.getByRole('heading', { name: 'Ajouter un compte' }),
    ).toBeVisible();

    // Type is already "Compte bancaire" by default
    // Fill label
    await page.getByLabel('Libellé').fill('Compte courant E2E');

    // Fill IBAN
    await page.getByLabel('IBAN *').fill('FR7630002005500000157845Z02');

    // Submit
    await page.getByRole('button', { name: 'Ajouter' }).click();

    // Should return to bank account list and show the new account
    await expect(page.getByText('Compte courant E2E')).toBeVisible();
    await expect(page.getByText('1 compte')).toBeVisible();
  });

  test('3.4 — create property', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from previous test');

    await page.goto('/properties/new');

    // Fill property form
    await page.getByLabel('Nom du bien').fill(propertyName);
    await page
      .getByLabel('Type de bien (optionnel)')
      .fill('Immeuble');

    // Fill address via autocomplete
    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('10 avenue des Champs-Élysées Paris');
    const listbox = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });
    await listbox.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: 'Créer le bien' }).click();

    // Should redirect to properties list
    await expect(page).toHaveURL('/properties');
    await expect(page.getByText(propertyName)).toBeVisible();

    // Navigate to property detail to get the ID
    await page.getByText(propertyName).first().click();
    await page.waitForURL(/\/properties\/[\w-]+/);
    const url = page.url();
    propertyId = url.match(/\/properties\/([\w-]+)/)?.[1] ?? '';
    expect(propertyId).toBeTruthy();
  });

  test('3.5 — create unit within property', async ({ page }) => {
    test.skip(!propertyId, 'Requires property from previous test');

    await page.goto(`/properties/${propertyId}/units/new`);

    // Fill unit form
    await page.getByLabel('Identifiant du lot').fill(unitIdentifier);

    // Select type: Appartement
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();

    // Fill surface
    await page.getByLabel('Surface (m²)').fill('65.5');

    // Fill floor
    await page.getByLabel('Étage (optionnel)').fill('3');

    // Submit
    await page.getByRole('button', { name: 'Créer le lot' }).click();

    // Should redirect to property detail and show the unit
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));
    await expect(page.getByText(unitIdentifier)).toBeVisible();
  });

  test('3.6 — verify UnitMosaic on dashboard shows the created unit', async ({
    page,
  }) => {
    test.skip(!propertyId, 'Requires unit from previous test');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // UnitMosaic should show the unit tile
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // Find the unit tile
    await expect(
      page.getByRole('gridcell', { name: new RegExp(unitIdentifier) }),
    ).toBeVisible();
  });
});
