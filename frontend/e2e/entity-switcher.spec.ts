import { test, expect } from './fixtures/auth.fixture';

test.describe('Entity switcher navigation', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  const entity1Name = `Switcher Entity A ${timestamp}`;
  const entity2Name = `Switcher Entity B ${timestamp}`;
  const property1Name = `Switcher Property A ${timestamp}`;
  const property2Name = `Switcher Property B ${timestamp}`;
  let entity1Id: string;
  let entity2Id: string;
  let property1Id: string;
  let property2Id: string;

  test('5.1 — seed two entities with properties and units', async ({
    page,
  }) => {
    // Create first entity
    await page.goto('/entities/new');
    await page.getByLabel("Nom de l'entité").fill(entity1Name);
    await page.getByLabel('SIRET').fill('11111111111111');
    const addr1 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr1.fill('1 rue de Rivoli Paris');
    const lb1 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb1.waitFor({ state: 'visible', timeout: 10_000 });
    await lb1.getByRole('option').first().click();
    await page.getByRole('button', { name: "Créer l'entité" }).click();
    await expect(page).toHaveURL('/entities');

    // Get entity1 ID
    await page.getByText(entity1Name).first().click();
    await page.waitForURL(/\/entities\/[\w-]+\/edit/);
    entity1Id = page.url().match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? '';

    // Create property for entity 1
    await page.goto('/properties/new');
    await page.getByLabel('Nom du bien').fill(property1Name);
    const addr2 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr2.fill('10 rue de la Paix Paris');
    const lb2 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb2.waitFor({ state: 'visible', timeout: 10_000 });
    await lb2.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Créer le bien' }).click();
    await expect(page).toHaveURL('/properties');

    // Get property1 ID
    await page.getByText(property1Name).first().click();
    await page.waitForURL(/\/properties\/[\w-]+/);
    property1Id = page.url().match(/\/properties\/([\w-]+)/)?.[1] ?? '';

    // Create unit for property 1
    await page.goto(`/properties/${property1Id}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Unit A ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Appartement' }).click();
    await page.getByLabel('Surface (m²)').fill('40');
    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${property1Id}`));

    // Create second entity
    await page.goto('/entities/new');
    // Change type to "Nom propre" to distinguish
    await page.getByText('SCI').click();
    await page.getByRole('option', { name: 'Nom propre' }).click();
    await page.getByLabel("Nom de l'entité").fill(entity2Name);
    const addr3 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr3.fill('25 boulevard Haussmann Paris');
    const lb3 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb3.waitFor({ state: 'visible', timeout: 10_000 });
    await lb3.getByRole('option').first().click();
    await page.getByRole('button', { name: "Créer l'entité" }).click();
    await expect(page).toHaveURL('/entities');

    // Get entity2 ID
    await page.getByText(entity2Name).first().click();
    await page.waitForURL(/\/entities\/[\w-]+\/edit/);
    entity2Id = page.url().match(/\/entities\/([\w-]+)\/edit/)?.[1] ?? '';

    // Switch to entity2 context (select it in EntitySwitcher)
    const switcher = page.getByRole('button', {
      name: "Sélecteur d'entité",
    });
    await switcher.click();
    await page.getByRole('menuitem', { name: entity2Name }).click();

    // Create property for entity 2
    await page.goto('/properties/new');
    await page.getByLabel('Nom du bien').fill(property2Name);
    const addr4 = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addr4.fill('30 avenue Montaigne Paris');
    const lb4 = page.getByRole('listbox', {
      name: "Suggestions d'adresses",
    });
    await lb4.waitFor({ state: 'visible', timeout: 10_000 });
    await lb4.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Créer le bien' }).click();
    await expect(page).toHaveURL('/properties');

    // Get property2 ID
    await page.getByText(property2Name).first().click();
    await page.waitForURL(/\/properties\/[\w-]+/);
    property2Id = page.url().match(/\/properties\/([\w-]+)/)?.[1] ?? '';

    // Create unit for property 2
    await page.goto(`/properties/${property2Id}/units/new`);
    await page.getByLabel('Identifiant du lot').fill(`Unit B ${timestamp}`);
    await page.getByText('Sélectionnez un type').click();
    await page.getByRole('option', { name: 'Parking' }).click();
    await page.getByLabel('Surface (m²)').fill('15');
    await page.getByRole('button', { name: 'Créer le lot' }).click();
    await page.waitForURL(new RegExp(`/properties/${property2Id}`));
  });

  test('5.2 — switch entity and dashboard UnitMosaic updates', async ({
    page,
  }) => {
    test.skip(!entity1Id || !entity2Id, 'Requires entities from seed test');

    // Start on dashboard with entity1 selected
    const switcher = page.getByRole('button', {
      name: "Sélecteur d'entité",
    });

    // Select entity1
    await page.goto('/dashboard');
    await switcher.click();
    await page.getByRole('menuitem', { name: entity1Name }).click();

    // Wait for mosaic to show entity1's unit
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('gridcell', { name: new RegExp(`Unit A ${timestamp}`) }),
    ).toBeVisible();

    // Switch to entity2
    await switcher.click();
    await page.getByRole('menuitem', { name: entity2Name }).click();

    // Mosaic should now show entity2's unit
    await expect(
      page.getByRole('gridcell', { name: new RegExp(`Unit B ${timestamp}`) }),
    ).toBeVisible({ timeout: 10_000 });

    // Entity1's unit should no longer be visible
    await expect(
      page.getByRole('gridcell', { name: new RegExp(`Unit A ${timestamp}`) }),
    ).not.toBeVisible();
  });

  test('5.3 — switch entity on properties page redirects to dashboard', async ({
    page,
  }) => {
    test.skip(!entity1Id || !entity2Id, 'Requires entities from seed test');

    // Navigate to properties page with entity1
    const switcher = page.getByRole('button', {
      name: "Sélecteur d'entité",
    });

    await page.goto('/properties');
    await switcher.click();
    await page.getByRole('menuitem', { name: entity1Name }).click();

    // We should now be on properties with entity1 context
    await expect(page.getByText(property1Name)).toBeVisible();

    // Switch entity while on properties page — should redirect to /dashboard
    await switcher.click();
    await page.getByRole('menuitem', { name: entity2Name }).click();

    // Should redirect to dashboard (entity-scoped page exclusion pattern)
    await expect(page).toHaveURL('/dashboard');
  });
});
