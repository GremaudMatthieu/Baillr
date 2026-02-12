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
    await page.getByLabel('Date de début').fill('2025-01-01');

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

  test('6.5 — configure billing lines on lease detail page', async ({ page }) => {
    test.skip(!entityId, 'Requires seed data');

    // Navigate to leases list
    await page.goto('/leases');
    await expect(page.getByText('Pierre Durand')).toBeVisible({ timeout: 10_000 });

    // Click on the lease to go to detail page
    await page.getByText('Pierre Durand').first().click();
    await page.waitForURL(/\/leases\/[\w-]+/);

    // Verify billing lines section exists with default rent line
    await expect(page.getByText('Lignes de facturation')).toBeVisible();
    await expect(page.getByText('Total mensuel')).toBeVisible();

    // Click "Configurer les lignes" to open the form
    await page.getByRole('button', { name: /Configurer les lignes/i }).click();

    // The form should appear with "Ajouter une provision" button
    await expect(page.getByText('Ajouter une provision')).toBeVisible();

    // Add a provision line
    await page.getByRole('button', { name: /Ajouter une provision/i }).click();

    // Fill in the provision — target the newly added row's inputs
    const billingRows = page.locator('fieldset .grid');
    const lastRow = billingRows.last();
    await lastRow.getByRole('textbox', { name: /Libellé/i }).fill('Charges locatives');
    await lastRow.getByRole('spinbutton', { name: /Montant/i }).fill('50');

    // Submit the form
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // After save, the form should close and show the table view
    await expect(page.getByText('Charges locatives')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Total mensuel')).toBeVisible();
  });

  test('6.6 — configure revision parameters on lease detail page', async ({ page }) => {
    test.skip(!entityId, 'Requires seed data');

    // Navigate to leases list
    await page.goto('/leases');
    await expect(page.getByText('Pierre Durand')).toBeVisible({ timeout: 10_000 });

    // Click on the lease to go to detail page
    await page.getByText('Pierre Durand').first().click();
    await page.waitForURL(/\/leases\/[\w-]+/);

    // Verify revision parameters section exists with configure prompt
    await expect(page.getByText('Paramètres de révision')).toBeVisible();
    await expect(
      page.getByText('Configurer les paramètres de révision'),
    ).toBeVisible();

    // Click "Configurer" to open the form
    await page.getByRole('button', { name: 'Configurer' }).click();

    // Fill revision day — Select (1-31), pick day 15
    await page.getByRole('combobox', { name: /Jour de révision/i }).click();
    await page.getByRole('option', { name: '15', exact: true }).click();

    // Fill revision month — Select, pick Mars (March = 3)
    await page.getByRole('combobox', { name: /Mois de révision/i }).click();
    await page.getByRole('option', { name: 'Mars' }).click();

    // Fill reference quarter — Select, pick Q2
    await page.getByRole('combobox', { name: /Trimestre de référence/i }).click();
    await page.getByRole('option', { name: /T2/ }).click();

    // Fill reference year
    await page.getByLabel('Année de référence').fill('2025');

    // Fill base index value
    await page.getByLabel(/Indice de base/).fill('142.06');

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // After save, form should close and display the configured values
    await expect(page.getByText('Date de révision annuelle')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(/15/)).toBeVisible();
    await expect(page.getByText(/Mars/)).toBeVisible();
    await expect(page.getByText(/T2 \(Avril-Juin\)/)).toBeVisible();
    await expect(page.getByText(/2025/)).toBeVisible();
    await expect(page.getByText('142.06')).toBeVisible();

    // Modifier button should now be visible
    await expect(
      page.getByRole('button', { name: /Modifier/i }),
    ).toBeVisible();
  });

  test('6.7 — terminate a lease from the detail page', async ({ page }) => {
    test.skip(!entityId, 'Requires seed data');

    // Navigate to leases list
    await page.goto('/leases');
    await expect(page.getByText('Pierre Durand')).toBeVisible({ timeout: 10_000 });

    // Click on the lease to go to detail page
    await page.getByText('Pierre Durand').first().click();
    await page.waitForURL(/\/leases\/[\w-]+/);

    // Verify the Résiliation section is present
    await expect(page.getByText('Résiliation')).toBeVisible();

    // Click "Résilier ce bail" button
    await page.getByRole('button', { name: /Résilier ce bail/i }).click();

    // Dialog should open
    await expect(page.getByLabelText('Date de fin')).toBeVisible();

    // Fill the end date
    await page.getByLabelText('Date de fin').fill('2024-01-01');

    // Click "Résilier" button in dialog
    await page.getByRole('button', { name: 'Résilier' }).click();

    // After termination, the badge "Résilié" should appear
    await expect(page.getByText('Résilié')).toBeVisible({ timeout: 10_000 });

    // The Résiliation section should disappear
    await expect(page.getByText('Résiliation')).not.toBeVisible();

    // End date should be displayed
    await expect(page.getByText('Date de fin')).toBeVisible();
  });

  test('6.8 — verify unit becomes vacant on dashboard after termination', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // The unit should now show as "vacant" since the lease was terminated
    const tile = page.getByRole('gridcell', { name: /Apt Lease.*vacant/ });
    await expect(tile).toBeVisible({ timeout: 10_000 });
  });
});
