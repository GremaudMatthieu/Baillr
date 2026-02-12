import { test, expect } from './fixtures/auth.fixture';

test.describe('Tenant management', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let propertyId: string;
  let tenantId: string;

  test('5.1 — seed entity, property and unit via UI', async ({ page }) => {
    // Create entity
    await page.goto('/entities/new');
    const entityName = `Tenant Entity ${timestamp}`;
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
    const propertyName = `Tenant Property ${timestamp}`;
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
    await page.getByLabel('Identifiant du lot').fill(`Unit Tenant ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('45');

    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${propertyId}`));
  });

  test('5.2 — register individual tenant', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/tenants/new');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Nouveau locataire' }),
    ).toBeVisible();

    // Select type: Particulier
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Particulier' }).click();

    // Fill name
    await page.getByLabel('Prénom').fill('Jean');
    await page.getByLabel('Nom').fill('Dupont');

    // Fill email
    await page.getByLabel('Email').fill(`jean.dupont.${timestamp}@example.com`);

    // Fill phone
    await page.getByLabel('Téléphone (optionnel)').fill('+33612345678');

    // Fill address via autocomplete
    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('15 rue de Rivoli Paris');
    const listbox = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await listbox.waitFor({ state: 'visible', timeout: 10_000 });
    await listbox.getByRole('option').first().click();

    // Verify address fields are populated
    await expect(page.getByLabel('Rue')).not.toHaveValue('');

    // Submit
    await page
      .getByRole('button', { name: 'Enregistrer le locataire' })
      .click();

    // Should navigate back to tenants list
    await expect(page).toHaveURL('/tenants', { timeout: 10_000 });
    await expect(page.getByText('Jean Dupont')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Particulier')).toBeVisible();

    // Navigate to tenant detail to capture ID
    await page.getByText('Jean Dupont').first().click();
    await page.waitForURL(/\/tenants\/[\w-]+/);
    tenantId = page.url().match(/\/tenants\/([\w-]+)/)?.[1] ?? '';
    expect(tenantId).toBeTruthy();
  });

  test('5.3 — register company tenant with SIRET', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/tenants/new');

    // Select type: Entreprise
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Entreprise' }).click();

    // Fill name
    await page.getByLabel('Prénom').fill('Marie');
    await page.getByLabel('Nom').fill('Martin');

    // Company-specific fields should be visible
    await page.getByLabel("Nom de l'entreprise").fill('SCI Les Oliviers');
    await page.getByLabel('SIRET (optionnel)').fill('98765432109876');

    // Fill email
    await page
      .getByLabel('Email')
      .fill(`marie.martin.${timestamp}@oliviers.fr`);

    // Submit
    await page
      .getByRole('button', { name: 'Enregistrer le locataire' })
      .click();

    // Should navigate back to tenants list
    await expect(page).toHaveURL('/tenants', { timeout: 10_000 });
    await expect(page.getByText('Marie Martin')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('SCI Les Oliviers')).toBeVisible();
    await expect(page.getByText('Entreprise')).toBeVisible();
  });

  test('5.4 — edit tenant and verify changes', async ({ page }) => {
    test.skip(!tenantId, 'Requires tenant from registration test');

    await page.goto(`/tenants/${tenantId}`);

    // Should display tenant detail
    await expect(page.getByText('Jean Dupont')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Particulier')).toBeVisible();

    // Click edit button (inline editing)
    await page.getByRole('button', { name: /modifier/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Modifier le locataire' }),
    ).toBeVisible();

    // Update first name
    await page.getByLabel('Prénom').fill('Jean-Pierre');

    // Submit
    await page.getByRole('button', { name: /^Enregistrer$/i }).click();

    // Navigate to tenant detail to verify changes persisted
    await page.goto(`/tenants/${tenantId}`);
    await expect(page.getByText('Jean-Pierre Dupont')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('5.5 — verify tenant onboarding action disappears after registration', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // The "Enregistrez vos locataires" onboarding action should NOT appear
    // since we have registered tenants
    await expect(
      page.getByText('Enregistrez vos locataires'),
    ).not.toBeVisible();
  });
});
