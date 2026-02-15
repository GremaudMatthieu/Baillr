import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';
import { randomUUID } from 'node:crypto';

test.describe('Revision → Rent call flow', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let leaseId: string;
  let api: ApiHelper;
  const originalRentCents = 75000; // 750€

  test('C2.2 — seed entity, property, unit, tenant, lease with revision params + record INSEE index via API', async ({
    page,
    request,
  }) => {
    // Get token from Clerk
    await page.goto('/dashboard');
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    // Create entity
    entityId = await api.createEntity({
      name: `E2E RevRC ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Create property
    const propertyId = await api.createProperty({
      entityId,
      name: `Prop RevRC ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Create unit
    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt RevRC ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Create tenant
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Pierre',
      lastName: 'RevisionTest',
      email: `pierre.rev.${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Create lease with IRL revision index, starting Jan 2026
    leaseId = await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: '2026-01-01T00:00:00.000Z',
      rentAmountCents: originalRentCents,
      revisionIndexType: 'IRL',
    });
    await api.waitForLeaseCount(entityId, 1);

    // Configure revision parameters: revision on Jan 1, reference Q1 2025, base index 138.19
    await api.configureRevisionParameters(leaseId, {
      revisionDay: 1,
      revisionMonth: 1,
      referenceQuarter: 'Q1',
      referenceYear: 2025,
      baseIndexValue: 138.19,
    });

    // Record matching INSEE index: IRL Q1 2025 = 142.06 (higher than base → rent increase)
    await api.recordInseeIndex(entityId, {
      id: randomUUID(),
      type: 'IRL',
      quarter: 'Q1',
      year: 2025,
      value: 142.06,
    });
  });

  test('C2.2 — calculate and approve revision via API, verify rent updated', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    // Navigate to dashboard first to ensure entity context is set
    await page.goto('/dashboard');
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    const request = page.request;
    api = new ApiHelper({ request, token });

    // Calculate revisions
    const calcResult = await api.calculateRevisions(entityId);
    expect(calcResult.calculated).toBe(1);
    expect(calcResult.errors).toHaveLength(0);

    // Wait for revision to appear in projection
    const revisions = await api.waitForRevisionCount(entityId, 1);
    expect(revisions).toHaveLength(1);
    const revision = revisions[0];
    expect(revision.status).toBe('pending');
    expect(revision.currentRentCents).toBe(originalRentCents);

    // New rent should be higher (142.06 / 138.19 * 75000 = 76_026 or similar)
    const newRentCents = revision.newRentCents as number;
    expect(newRentCents).toBeGreaterThan(originalRentCents);

    // Approve the revision
    const revisionId = revision.id as string;
    await api.approveRevisions(entityId, [revisionId]);

    // Wait for revision to be approved
    const approved = await api.waitForRevisionStatus(entityId, 'approved');
    expect(approved.status).toBe('approved');

    // Verify lease rent was updated in projection
    const start = Date.now();
    let leaseRent = originalRentCents;
    while (Date.now() - start < 5000) {
      const leaseData = await api.getLease(leaseId);
      leaseRent = (leaseData as Record<string, unknown>).rentAmountCents as number;
      if (leaseRent !== originalRentCents) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    expect(leaseRent).toBe(newRentCents);
  });

  test('C2.2 — generate rent call for next month and verify it uses revised rent', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    // Navigate to dashboard to get token
    await page.goto('/dashboard');
    const token = await page.evaluate(async () => {
      const w = window as unknown as {
        Clerk?: { session?: { getToken: () => Promise<string> } };
      };
      return w.Clerk?.session?.getToken() ?? '';
    });
    const request = page.request;
    api = new ApiHelper({ request, token });

    // Generate rent calls for the current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const genResult = await api.generateRentCalls(entityId, month);
    expect(genResult.generated).toBe(1);

    // Wait for rent call to appear
    const rentCalls = await api.waitForRentCallCount(entityId, month, 1);
    expect(rentCalls).toHaveLength(1);

    // The rent call should use the REVISED rent amount (not the original 750€)
    const rentCall = rentCalls[0];
    const rentAmountCents = rentCall.rentAmountCents as number;

    // Get the expected revised rent from the approved revision
    const { data: revisions } = await api.getRevisions(entityId);
    const approvedRevision = revisions.find((r) => r.status === 'approved');
    const expectedRentCents = approvedRevision?.newRentCents as number;

    expect(rentAmountCents).toBe(expectedRentCents);
    expect(rentAmountCents).toBeGreaterThan(originalRentCents);

    // Verify on the UI
    await page.goto('/rent-calls');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Appels de loyer' }),
    ).toBeVisible({ timeout: 10_000 });

    // The tenant name should appear in the list
    await expect(page.getByText('RevisionTest')).toBeVisible({
      timeout: 10_000,
    });
  });
});
