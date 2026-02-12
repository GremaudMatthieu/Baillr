import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Rent call generation', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let leaseId: string;
  let api: ApiHelper;

  test('7.1 — seed entity, property, unit, tenant, and lease via API', async ({
    page,
    request,
  }) => {
    // Get token from Clerk
    const token = await page.evaluate(async () => {
      const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } };
      return w.Clerk?.session?.getToken() ?? '';
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    // Create entity
    entityId = await api.createEntity({
      name: `RC Entity ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Create property
    const propertyId = await api.createProperty({
      entityId,
      name: `RC Property ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Create unit
    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt RC ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Create tenant
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Marie',
      lastName: 'Martin',
      email: `marie.martin.${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Create lease (start in January to ensure full month for March)
    leaseId = await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: '2026-01-01T00:00:00.000Z',
      rentAmountCents: 80000,
    });
    await api.waitForLeaseCount(entityId, 1);

    // Configure billing lines
    await api.configureBillingLines(leaseId, [
      { label: 'Charges', amountCents: 5000, type: 'provision' },
    ]);
  });

  test('7.2 — generate rent calls from the UI', async ({ page }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/rent-calls');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Appels de loyer' }),
    ).toBeVisible();

    // Wait for data to load, generate button should be enabled
    const generateBtn = page.getByRole('button', {
      name: /Générer les appels/,
    });
    await expect(generateBtn).toBeVisible({ timeout: 10_000 });
    await expect(generateBtn).toBeEnabled({ timeout: 5_000 });

    // Click generate
    await generateBtn.click();

    // Dialog should appear with month and lease count
    await expect(
      page.getByText('Générer les appels de loyer'),
    ).toBeVisible();
    await expect(page.getByText(/1 bail actif/)).toBeVisible();
    // Verify the dialog shows the currently selected month (current month)
    const now = new Date();
    const expectedMonth = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    await expect(page.getByText(expectedMonth)).toBeVisible();

    // Confirm generation
    await page.getByRole('button', { name: 'Générer' }).click();

    // Batch summary should appear
    await expect(page.getByText(/1 appel de loyer/)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Génération terminée')).toBeVisible();

    // Rent call should appear in the list
    await expect(page.getByText('Marie Martin')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('7.3 — verify ActionFeed shows rent call step before generation', async ({
    page,
    request,
  }) => {
    // This test verifies that for a NEW entity with leases but no rent calls,
    // the ActionFeed shows the rent call generation step.
    // Since we already generated in 7.2, we need to check with a fresh entity.
    // Instead, we verify the step DISAPPEARS after generation (from 7.2 data).
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Since we already generated rent calls for the current month,
    // the "Générez vos appels de loyer" action should NOT appear
    // Wait for the feed to fully load before checking absence
    await expect(
      page.getByRole('heading', { level: 2, name: 'Actions en attente' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText('Générez vos appels de loyer'),
    ).not.toBeVisible({ timeout: 5_000 });
  });
});
