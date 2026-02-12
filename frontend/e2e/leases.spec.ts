import { test, expect } from './fixtures/auth.fixture';

test.describe('Lease management', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let propertyId: string;
  let tenantId: string;

  test('6.1 — seed entity, property, unit and tenant via UI', async ({ page }) => {
    // Create entity
    await page.goto('/entities/new');
    const entityName = `Lease Entity ${timestamp}`;
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
    const propertyName = `Lease Property ${timestamp}`;
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

    // Create unit
    await page.goto(`/properties/${propertyId}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Apt Lease ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('55');

    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));

    // Create tenant
    await page.goto('/tenants/new');
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Particulier' }).click();
    await page.getByLabel('Prénom').fill('Pierre');
    await page.getByLabel('Nom').fill('Durand');
    await page.getByLabel('Email').fill(`pierre.durand.${timestamp}@example.com`);

    await page
      .getByRole('button', { name: 'Enregistrer le locataire' })
      .click();
    await expect(page).toHaveURL('/tenants', { timeout: 10_000 });
    await expect(page.getByText('Pierre Durand')).toBeVisible({ timeout: 10_000 });

    // Get tenant ID
    await page.getByText('Pierre Durand').first().click();
    await page.waitForURL(/\/tenants\/[\w-]+/);
    tenantId = page.url().match(/\/tenants\/([\w-]+)/)?.[1] ?? '';
    expect(tenantId).toBeTruthy();
  });

  test('6.2 — create a lease from the form', async ({ page }) => {
    test.skip(!entityId || !tenantId, 'Requires seed data');

    await page.goto('/leases/new');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Nouveau bail' }),
    ).toBeVisible();

    // Select tenant
    await page.getByText('Sélectionnez un locataire').click();
    await page.getByRole('option', { name: /Pierre Durand/ }).click();

    // Select unit
    await page.getByText('Sélectionnez un lot').click();
    await page.getByRole('option', { name: /Apt Lease/ }).click();

    // Fill start date
    await page.getByLabel('Date de début').fill('2026-03-01');

    // Fill rent
    await page.getByLabel('Loyer mensuel (€)').fill('630');

    // Fill security deposit
    await page.getByLabel('Dépôt de garantie (€)').fill('630');

    // Due date default is 5, keep it

    // IRL is default, keep it

    // Submit
    await page.getByRole('button', { name: /créer le bail/i }).click();

    // Should navigate back to leases list
    await expect(page).toHaveURL('/leases', { timeout: 10_000 });
    await expect(page.getByText('Pierre Durand')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('6.3 — verify lease appears on dashboard UnitMosaic', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Wait for the mosaic to load with the unit — it should show "occupé" now
    const tile = page.getByRole('gridcell', { name: /Apt Lease.*occupé/ });
    await expect(tile).toBeVisible({ timeout: 10_000 });
  });

  test('6.4 — verify ActionFeed lease step disappears after lease creation', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // The "Créez vos baux" onboarding action should NOT appear
    // since we have created a lease
    await expect(page.getByText('Créez vos baux')).not.toBeVisible();
  });
});
