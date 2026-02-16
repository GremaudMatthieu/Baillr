import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Account Book Excel Export', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let api: ApiHelper;

  test('8.3.1 — seed entity, property, unit, tenant, lease, rent call via API', async ({
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
      name: `Export Entity ${timestamp}`,
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
      identifier: `Apt Export ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Marc',
      lastName: 'Export',
      email: `export-${timestamp}@test.com`,
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
      rentAmountCents: 75000,
    });
    await api.waitForLeaseCount(entityId, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);
    await api.waitForAccountEntryCount(entityId, 1);
  });

  test('8.3.2 — export button is visible and triggers xlsx download', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires entity from seed test');

    await page.goto('/accounting');
    await expect(
      page.getByRole('heading', { name: 'Livre de comptes' }),
    ).toBeVisible({ timeout: 10_000 });

    // Wait for data to load (entries visible)
    await expect(page.getByText('Marc Export')).toBeVisible({
      timeout: 10_000,
    });

    const exportButton = page.getByRole('button', {
      name: /exporter en excel/i,
    });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();

    // Trigger download and verify
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportButton.click(),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^livre-comptes-.*\.xlsx$/);
  });
});
