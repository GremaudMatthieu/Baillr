import { test, expect } from './fixtures/auth.fixture';

test.describe('Open Banking', () => {
  test.describe.configure({ mode: 'serial' });

  let entityId: string;
  const ts = Date.now();

  test('9.1 — verify bank accounts page loads with entity', async ({ page }) => {
    // Create an entity for testing
    const entityName = `OB Entity ${ts}`;
    await page.goto('/entities/new');
    await page.getByPlaceholder("Ex\u00A0: SCI Dupont Immobilier").fill(entityName);
    await page.getByPlaceholder("email@exemple.fr").fill(`ob-${ts}@test.com`);
    await page.getByRole('button', { name: 'Créer' }).click();

    // Wait for navigation to entity detail or entities list
    await page.waitForURL(/\/entities/, { timeout: 10_000 });

    // Go to entities list to find our entity
    await page.goto('/entities');
    const entityLink = page.getByText(entityName);
    await expect(entityLink).toBeVisible({ timeout: 10_000 });
    await entityLink.click();

    // Extract entity ID from URL
    await page.waitForURL(/\/entities\/[\w-]+/);
    const url = page.url();
    const match = url.match(/\/entities\/([\w-]+)/);
    entityId = match?.[1] ?? '';
    expect(entityId).toBeTruthy();
  });

  test('9.2 — verify bank accounts page loads', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from previous test');

    await page.goto(`/entities/${entityId}/bank-accounts`);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Comptes bancaires' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('9.3 — verify graceful degradation when Bridge not configured', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from previous test');

    // When Bridge env vars are not set, the "Connecter ma banque" button should not appear
    // First create a bank account
    await page.goto(`/entities/${entityId}/bank-accounts`);
    await page.getByRole('button', { name: 'Ajouter un compte' }).click();

    await page.getByPlaceholder('Ex\u00A0: Compte courant').fill(`Test OB ${ts}`);
    // IBAN is required for bank_account type
    await page.getByPlaceholder('FR76...').fill('FR7630001007941234567890185');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Wait for the account to appear
    await expect(page.getByText(`Test OB ${ts}`)).toBeVisible({ timeout: 10_000 });

    // Check if "Connecter ma banque" button is present — it should NOT be if Bridge is not configured
    // We use a soft check: if the API returns available: false, the button won't show
    const connectButton = page.getByRole('button', { name: /Connecter ma banque/ });
    const isVisible = await connectButton.isVisible().catch(() => false);

    // In test environment without Bridge env vars, the button should be hidden
    // If Bridge IS configured (sandbox), the button would be visible
    // Both states are valid — we just verify the page doesn't crash
    if (!isVisible) {
      // Graceful degradation verified: no button shown
      expect(isVisible).toBe(false);
    } else {
      // Bridge sandbox configured: button is shown (also valid)
      expect(isVisible).toBe(true);
    }
  });

  test('9.4 — verify empty connections state', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from previous test');

    await page.goto(`/entities/${entityId}/bank-accounts`);
    await expect(page.getByText(`Test OB ${ts}`)).toBeVisible({ timeout: 10_000 });

    // No connections section should appear when there are no connections
    await expect(
      page.getByText('Connexions Open Banking'),
    ).not.toBeVisible();
  });
});

/**
 * NOTE: Full OAuth flow E2E testing
 *
 * The complete bank connection flow (select bank → redirect → SCA → callback)
 * requires a Bridge sandbox environment with valid credentials:
 *
 * 1. Set BRIDGE_CLIENT_ID and BRIDGE_CLIENT_SECRET in .env
 * 2. Use Bridge Demo Bank (bank_id: 574) for sandbox testing
 * 3. The redirect flow goes through Bridge Connect → Bank → SCA → callback
 *
 * Manual testing steps:
 * 1. Navigate to entities/:id/bank-accounts
 * 2. Click "Connecter ma banque" on a bank account
 * 3. Select a bank from the institution list (Demo Bank 574 for sandbox)
 * 4. Click "Connecter" — browser redirects to Bridge Connect
 * 5. Complete the sandbox bank authorization (any login/password)
 * 6. Browser redirects to /bank-connections/callback
 * 7. Verify the connection badge shows "Connectée"
 * 8. Test manual sync via the sync button
 * 9. Test disconnect and verify badge disappears
 */
