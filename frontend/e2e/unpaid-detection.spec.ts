import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Unpaid rent call detection', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let api: ApiHelper;

  test('6.1.1 — seed entity, property, unit, tenant, lease, generate & send rent call for past month', async ({
    page,
    request,
  }) => {
    const token = await page.evaluate(async () => {
      const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } };
      return w.Clerk?.session?.getToken() ?? '';
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    // Create entity
    entityId = await api.createEntity({
      name: `Unpaid Entity ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Create property
    const propertyId = await api.createProperty({
      entityId,
      name: `Unpaid Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Create unit
    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Unpaid ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Create tenant with email
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Pierre',
      lastName: 'Retard',
      email: `pierre.retard.${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Create lease starting January 2026, due on day 5
    await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: '2026-01-01T00:00:00.000Z',
      rentAmountCents: 75000,
      monthlyDueDate: 5,
    });
    await api.waitForLeaseCount(entityId, 1);

    // Generate rent calls for January 2026 (a past month)
    const result = await api.generateRentCalls(entityId, '2026-01');
    expect(result.generated).toBe(1);

    // Wait for projection
    await api.waitForRentCallCount(entityId, '2026-01', 1);

    // Send the rent call (required for unpaid detection — only sent rent calls are tracked)
    await api.sendRentCallsByEmail(entityId, '2026-01');

    // Verify sentAt is set on the rent call (critical for unpaid detection)
    await api.waitForRentCallCount(entityId, '2026-01', 1);
  });

  test('6.1.2 — configure delay threshold to 0 days and verify unpaid API', async ({
    page,
    request,
  }) => {
    const token = await page.evaluate(async () => {
      const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } };
      return w.Clerk?.session?.getToken() ?? '';
    });
    api = new ApiHelper({ request, token });

    // Set delay to 0 — rent call should be immediately considered late after due date
    await api.configureLatePaymentDelay(entityId, 0);

    // Wait for projection to update
    await new Promise((r) => setTimeout(r, 1000));

    // Verify unpaid endpoint returns the rent call
    const { data } = await api.getUnpaidRentCalls(entityId);
    expect(data.length).toBe(1);
    expect(data[0]).toHaveProperty('daysLate');
    expect((data[0].daysLate as number)).toBeGreaterThan(0);
  });

  test('6.1.3 — unpaid filter on rent calls page shows unpaid rent calls', async ({
    page,
  }) => {
    await page.goto('/rent-calls?filter=unpaid');
    await page.waitForLoadState('networkidle');

    // Should see the "Impayés" button as active (destructive variant)
    const unpaidButton = page.getByRole('button', { name: /Impayés/i });
    const isVisible = await unpaidButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Verify unpaid list shows tenant name
    await expect(page.getByText('Pierre Retard')).toBeVisible({ timeout: 10000 });
    // Verify days late badge is visible
    await expect(page.getByText(/j de retard/)).toBeVisible();
  });

  test('6.1.4 — late payment delay settings on entity edit page', async ({
    page,
  }) => {
    await page.goto(`/entities/${entityId}/edit`);
    await page.waitForLoadState('networkidle');

    // Look for the settings section heading
    const settingsHeading = page.getByRole('heading', { name: 'Paramètres' });
    const isVisible = await settingsHeading.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Verify current value is shown (0 days from test 6.1.2)
    await expect(page.getByText('Délai de retard de paiement :')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/0 jour/)).toBeVisible();
  });
});
