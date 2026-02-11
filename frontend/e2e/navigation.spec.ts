import { test, expect } from './fixtures/auth.fixture';

test.describe('Navigation', () => {
  test('6.1 — sidebar navigation links work', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Navigate to entities
    await page.getByRole('link', { name: 'Entités' }).first().click();
    await expect(page).toHaveURL('/entities');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Entités propriétaires' }),
    ).toBeVisible();

    // Navigate to properties
    await page.getByRole('link', { name: 'Biens' }).first().click();
    await expect(page).toHaveURL('/properties');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Biens immobiliers' }),
    ).toBeVisible();

    // Navigate back to dashboard
    await page.getByRole('link', { name: 'Tableau de bord' }).first().click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('6.2 — back button navigates to previous page', async ({ page }) => {
    // Navigate: dashboard → entities → new entity
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Entités' }).first().click();
    await expect(page).toHaveURL('/entities');

    await page.getByRole('link', { name: 'Nouvelle entité' }).click();
    await expect(page).toHaveURL('/entities/new');

    // Click cancel (acts as back)
    await page.getByRole('button', { name: 'Annuler' }).click();
    await expect(page).toHaveURL('/entities');
  });

  test('6.3 — navigation flow: dashboard → properties → property → unit → back', async ({
    page,
  }) => {
    // First create some test data for navigation
    const ts = Date.now();
    const entityName = `Nav Entity ${ts}`;
    const propertyName = `Nav Property ${ts}`;
    const unitId = `Nav Unit ${ts}`;

    // Create entity
    await page.goto('/entities/new');
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.getByLabel('SIRET').fill('55555555555555');
    const addr = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr.fill('1 rue de Lille Paris');
    const lb = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb.waitFor({ state: 'visible', timeout: 10_000 });
    await lb.getByRole('option').first().click();
    await page.getByRole('button', { name: "Créer l'entité" }).click();
    await expect(page).toHaveURL('/entities');

    // Create property
    await page.goto('/properties/new');
    await page.getByLabel('Nom du bien').fill(propertyName);
    const addr2 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr2.fill('15 rue du Faubourg Saint-Honoré Paris');
    const lb2 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb2.waitFor({ state: 'visible', timeout: 10_000 });
    await lb2.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Créer le bien' }).click();
    await expect(page).toHaveURL('/properties');

    // Get property ID
    await page.getByText(propertyName).first().click();
    await page.waitForURL(/\/properties\/[\w-]+/);
    const propertyId = page.url().match(/\/properties\/([\w-]+)/)?.[1] ?? '';

    // Create unit
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(unitId);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('30');
    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));

    // Now test the navigation flow
    // Start from dashboard
    await page.goto('/dashboard');

    // Navigate to properties via sidebar
    await page.getByRole('link', { name: 'Biens' }).first().click();
    await expect(page).toHaveURL('/properties');

    // Click on property
    await page.getByText(propertyName).first().click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));

    // Click on unit
    await page.getByText(unitId).first().click();
    await page.waitForURL(/\/units\/[\w-]+/);

    // Go back — should return to property detail
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page).toHaveURL(new RegExp(`/properties/${propertyId}$`));

    // Go back again — should return to properties list
    await page.getByRole('button', { name: 'Retour' }).click();
    await expect(page).toHaveURL('/properties');
  });
});
