import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Account Book (Livre de comptes)', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let api: ApiHelper;

  test('8.1.1 — seed entity, property, unit, tenant, lease via API', async ({
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
      name: `Accounting Entity ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    await api.addBankAccount({
      entityId,
      label: `Compte ${timestamp}`,
      iban: 'FR7612345678901234567890189',
      bic: 'BNPAFRPP',
      bankName: 'BNP',
    });

    const propertyId = await api.createProperty({
      entityId,
      name: `Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Accounting ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Marc',
      lastName: 'Comptable',
      email: `comptable-${timestamp}@test.com`,
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
      rentAmountCents: 85000,
    });
    await api.waitForLeaseCount(entityId, 1);
  });

  test('8.1.2 — accounting page shows empty state', async ({ page }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/accounting');
    await expect(
      page.getByRole('heading', { name: 'Livre de comptes' }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText('Aucune écriture comptable'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('8.1.3 — generate rent call and verify debit entry', async ({
    page,
    request,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    // Re-create API helper if needed (serial tests share scope)
    if (!api) {
      const token = await page.evaluate(async () => {
        const w = window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string> } };
        };
        return w.Clerk?.session?.getToken() ?? '';
      });
      api = new ApiHelper({ request, token });
    }

    const currentMonth = new Date();
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);

    // Wait for account entry projection
    await api.waitForAccountEntryCount(entityId, 1);

    await page.goto('/accounting');
    await expect(
      page.getByRole('heading', { name: 'Livre de comptes' }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify debit entry appears
    await expect(page.getByText('Marc Comptable')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Appel de loyer')).toBeVisible();
    await expect(page.getByText('Solde total')).toBeVisible();
  });

  test('8.1.4 — record payment and verify credit entry', async ({
    page,
    request,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    if (!api) {
      const token = await page.evaluate(async () => {
        const w = window as unknown as {
          Clerk?: { session?: { getToken: () => Promise<string> } };
        };
        return w.Clerk?.session?.getToken() ?? '';
      });
      api = new ApiHelper({ request, token });
    }

    const currentMonth = new Date();
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    const { data: rentCalls } = await api.getRentCalls(entityId, month);
    const rentCallId = rentCalls[0].id as string;

    await api.recordManualPayment(entityId, rentCallId, {
      amountCents: 85000,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString(),
      payerName: 'Marc Comptable',
    });

    // Wait for both entries (debit + credit)
    await api.waitForAccountEntryCount(entityId, 2);

    await page.goto('/accounting');
    await expect(
      page.getByRole('heading', { name: 'Livre de comptes' }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify both entries visible
    await expect(page.getByText('Appel de loyer')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Paiement')).toBeVisible();
    await expect(page.getByText('Solde total')).toBeVisible();
  });
});
