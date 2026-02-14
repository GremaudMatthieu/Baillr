import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Partial payments and tenant account', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let tenantId: string;
  let api: ApiHelper;

  test('5.5.1 — seed entity, property, unit, tenant, lease, rent call via API', async ({
    page,
    request,
  }) => {
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    entityId = await api.createEntity({
      name: `Partial Pay ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    const propertyId = await api.createProperty({
      entityId,
      name: `Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Partial ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    tenantId = await api.registerTenant({
      entityId,
      firstName: 'Sophie',
      lastName: 'Partiel',
      email: `partiel-${timestamp}@test.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    const currentMonth = new Date();
    const leaseStartDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).toISOString();

    await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: leaseStartDate,
      rentAmountCents: 80000,
    });
    await api.waitForLeaseCount(entityId, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);
  });

  test('5.5.2 — record partial payment, verify amber badge', async ({ page }) => {
    await page.goto('/rent-calls');

    // Wait for rent call
    await expect(page.getByText('Sophie Partiel')).toBeVisible({ timeout: 10000 });

    // Click record payment
    await page.getByRole('button', { name: /Enregistrer un paiement/i }).click();

    // Dialog should open with full amount pre-filled
    await expect(page.getByText('Enregistrer un paiement')).toBeVisible();
    const amountInput = page.getByLabel('Montant (€)');
    await expect(amountInput).toHaveValue('800.00');

    // Change to partial amount (500 €)
    await amountInput.clear();
    await amountInput.fill('500');

    // Submit
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Wait for partial payment badge to appear
    await expect(page.getByText(/Partiellement payé/)).toBeVisible({ timeout: 10000 });
  });

  test('5.5.3 — record remaining payment, verify green badge', async ({ page }) => {
    await page.goto('/rent-calls');

    // Wait for partial badge
    await expect(page.getByText(/Partiellement payé/)).toBeVisible({ timeout: 10000 });

    // Click record payment again (should still be visible for partial)
    await page.getByRole('button', { name: /Enregistrer un paiement/i }).click();

    // Dialog should open with remaining balance pre-filled (300 €)
    await expect(page.getByText('Enregistrer un paiement')).toBeVisible();
    const amountInput = page.getByLabel('Montant (€)');
    await expect(amountInput).toHaveValue('300.00');

    // Submit with remaining amount
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Wait for paid badge to appear
    await expect(page.getByText(/Payé le/)).toBeVisible({ timeout: 10000 });
  });

  test('5.5.4 — verify tenant account shows debit and credits', async () => {
    // Use API to check tenant account (avoids complex page navigation)
    const account = await api.getTenantAccount(entityId, tenantId);

    // Should have at least 3 entries: 1 debit (rent call) + 2 credits (payments)
    expect(account.entries.length).toBeGreaterThanOrEqual(3);
    expect(account.balanceCents).toBe(0); // Fully paid = balanced
  });
});
