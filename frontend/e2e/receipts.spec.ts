import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Receipt (quittance/reçu) download', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let api: ApiHelper;

  test('5.6.1 — seed entity, property, unit, tenant, lease, rent call + full payment via API', async ({
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
      name: `Receipt Entity ${timestamp}`,
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
      identifier: `Apt Receipt ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Alice',
      lastName: 'Quittance',
      email: `quittance-${timestamp}@test.com`,
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
      rentAmountCents: 70000,
    });
    await api.waitForLeaseCount(entityId, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);

    // Get the rent call ID
    const { data: rentCalls } = await api.getRentCalls(entityId, month);
    const rentCallId = rentCalls[0].id as string;

    // Record full payment via API
    await api.recordManualPayment(entityId, rentCallId, {
      amountCents: 70000,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString(),
      payerName: 'Alice Quittance',
    });

    // Wait for payment to be processed
    await api.waitForRentCallStatus(entityId, month, 'paid', 10000);
  });

  test('5.6.2 — quittance download button visible for paid rent call', async ({
    page,
  }) => {
    await page.goto('/rent-calls');

    // Wait for rent call list
    await expect(page.getByText('Alice Quittance')).toBeVisible({
      timeout: 10000,
    });

    // Quittance button should be visible
    const quittanceBtn = page.getByRole('button', { name: /Quittance/i });
    await expect(quittanceBtn).toBeVisible();

    // Download the quittance PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      quittanceBtn.click(),
    ]);

    // Verify filename contains "quittance"
    const filename = download.suggestedFilename();
    expect(filename).toContain('quittance');
    expect(filename).toEndWith('.pdf');
  });

  test('5.6.3 — no receipt button for unpaid rent call', async ({
    page,
    request,
  }) => {
    // Create a second lease+rent call without payment
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    const api2 = new ApiHelper({ request, token });

    const entityId2 = await api2.createEntity({
      name: `Unpaid Entity ${timestamp}`,
    });
    await api2.waitForEntityCount(2);

    const propId2 = await api2.createProperty({
      entityId: entityId2,
      name: `Prop Unpaid ${timestamp}`,
    });
    await api2.waitForPropertyCount(entityId2, 1);

    const unitId2 = await api2.createUnit({
      propertyId: propId2,
      identifier: `Apt Unpaid ${timestamp}`,
    });
    await api2.waitForUnitCount(propId2, 1);

    const tenantId2 = await api2.registerTenant({
      entityId: entityId2,
      firstName: 'Bob',
      lastName: 'Nopay',
      email: `nopay-${timestamp}@test.com`,
    });
    await api2.waitForTenantCount(entityId2, 1);

    const currentMonth = new Date();
    const leaseStartDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).toISOString();

    await api2.createLease({
      entityId: entityId2,
      tenantId: tenantId2,
      unitId: unitId2,
      startDate: leaseStartDate,
      rentAmountCents: 55000,
    });
    await api2.waitForLeaseCount(entityId2, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api2.generateRentCalls(entityId2, month);
    await api2.waitForRentCallCount(entityId2, month, 1);

    // Switch to this entity and check rent calls page
    await page.goto('/rent-calls');
    // Wait for page to show the unpaid rent call
    await expect(page.getByText('Bob Nopay')).toBeVisible({ timeout: 10000 });

    // No quittance or reçu button should be visible
    await expect(
      page.getByRole('button', { name: /Quittance/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /Reçu/i }),
    ).not.toBeVisible();
  });

  test('5.6.4 — reçu download button visible for partial payment', async ({
    page,
    request,
  }) => {
    // Create entity with partial payment
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    const api3 = new ApiHelper({ request, token });

    const entityId3 = await api3.createEntity({
      name: `Partial Receipt ${timestamp}`,
    });
    await api3.waitForEntityCount(3);

    await api3.addBankAccount({
      entityId: entityId3,
      label: `Compte Partial ${timestamp}`,
      iban: 'FR7612345678901234567890189',
      bic: 'BNPAFRPP',
      bankName: 'BNP',
    });

    const propId3 = await api3.createProperty({
      entityId: entityId3,
      name: `Prop Partial ${timestamp}`,
    });
    await api3.waitForPropertyCount(entityId3, 1);

    const unitId3 = await api3.createUnit({
      propertyId: propId3,
      identifier: `Apt Partial Receipt ${timestamp}`,
    });
    await api3.waitForUnitCount(propId3, 1);

    const tenantId3 = await api3.registerTenant({
      entityId: entityId3,
      firstName: 'Claire',
      lastName: 'Partiel',
      email: `partiel-receipt-${timestamp}@test.com`,
    });
    await api3.waitForTenantCount(entityId3, 1);

    const currentMonth = new Date();
    const leaseStartDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    ).toISOString();

    await api3.createLease({
      entityId: entityId3,
      tenantId: tenantId3,
      unitId: unitId3,
      startDate: leaseStartDate,
      rentAmountCents: 60000,
    });
    await api3.waitForLeaseCount(entityId3, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api3.generateRentCalls(entityId3, month);
    await api3.waitForRentCallCount(entityId3, month, 1);

    // Record partial payment
    const { data: rentCalls3 } = await api3.getRentCalls(entityId3, month);
    const rentCallId3 = rentCalls3[0].id as string;

    await api3.recordManualPayment(entityId3, rentCallId3, {
      amountCents: 30000,
      paymentMethod: 'check',
      paymentDate: new Date().toISOString(),
      payerName: 'Claire Partiel',
    });

    await api3.waitForRentCallStatus(entityId3, month, 'partial', 10000);

    // Navigate to rent calls page
    await page.goto('/rent-calls');
    await expect(page.getByText('Claire Partiel')).toBeVisible({
      timeout: 10000,
    });

    // Reçu button should be visible
    const recuBtn = page.getByRole('button', { name: /Reçu/i });
    await expect(recuBtn).toBeVisible();

    // Download the reçu PDF
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      recuBtn.click(),
    ]);

    // Verify filename contains "recu-paiement"
    const filename = download.suggestedFilename();
    expect(filename).toContain('recu-paiement');
    expect(filename).toEndWith('.pdf');
  });
});
