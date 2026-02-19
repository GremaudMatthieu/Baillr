import { test, expect } from './fixtures/auth.fixture';

test.describe('Alert preferences', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;

  test('seed — create entity via UI', async ({ page }) => {
    await page.goto('/entities/new');
    const entityName = `Alert Entity ${timestamp}`;
    await page.getByLabel("Nom de l'entité").fill(entityName);
    await page.getByLabel('SIRET').fill('12345678901234');

    const addressInput = page.getByRole('combobox', {
      name: 'Rechercher une adresse',
    });
    await addressInput.fill('10 rue de Rivoli Paris');
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
  });

  test('8.1 — alert preferences section is visible on entity settings page', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto(`/entities/${entityId}/edit`);

    // The "Alertes email" heading should be visible
    await expect(
      page.getByRole('heading', { name: 'Alertes email' }),
    ).toBeVisible();

    // All 3 alert type labels should be visible
    await expect(page.getByText('Loyers impayés')).toBeVisible();
    await expect(page.getByText('Assurances expirantes')).toBeVisible();
    await expect(page.getByText('Relances impayés')).toBeVisible();
  });

  test('8.2 — toggle alert preference off and verify persistence', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto(`/entities/${entityId}/edit`);

    // Wait for switches to load
    await expect(page.getByText('Loyers impayés')).toBeVisible();

    // All switches should be checked by default (enabled)
    const switches = page.getByRole('switch');
    await expect(switches).toHaveCount(3);

    // All should start as checked
    await expect(switches.nth(0)).toHaveAttribute('data-state', 'checked');
    await expect(switches.nth(1)).toHaveAttribute('data-state', 'checked');
    await expect(switches.nth(2)).toHaveAttribute('data-state', 'checked');

    // Toggle the second switch off (Assurances expirantes)
    await switches.nth(1).click();
    await expect(switches.nth(1)).toHaveAttribute('data-state', 'unchecked');

    // Navigate away and come back to verify persistence
    await page.goto('/');
    await page.goto(`/entities/${entityId}/edit`);

    // Wait for preferences to load
    await expect(page.getByText('Loyers impayés')).toBeVisible();

    // Verify the toggle state persisted
    const switchesAfter = page.getByRole('switch');
    await expect(switchesAfter.nth(0)).toHaveAttribute(
      'data-state',
      'checked',
    );
    await expect(switchesAfter.nth(1)).toHaveAttribute(
      'data-state',
      'unchecked',
    );
    await expect(switchesAfter.nth(2)).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  test('8.3 — toggle alert preference back on', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto(`/entities/${entityId}/edit`);
    await expect(page.getByText('Loyers impayés')).toBeVisible();

    const switches = page.getByRole('switch');

    // The second switch should still be unchecked from previous test
    await expect(switches.nth(1)).toHaveAttribute('data-state', 'unchecked');

    // Toggle it back on
    await switches.nth(1).click();
    await expect(switches.nth(1)).toHaveAttribute('data-state', 'checked');

    // Navigate away and verify
    await page.goto('/');
    await page.goto(`/entities/${entityId}/edit`);

    await expect(page.getByText('Assurances expirantes')).toBeVisible();
    const switchesAfter = page.getByRole('switch');
    await expect(switchesAfter.nth(1)).toHaveAttribute(
      'data-state',
      'checked',
    );
  });
});
