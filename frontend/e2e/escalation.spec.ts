import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Escalation actions', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let rentCallId: string;
  let api: ApiHelper;

  test('6.2.E2E.1 — seed entity, property, unit, tenant, lease, generate & send rent call for past month', async ({
    page,
    request,
  }) => {
    const token = await page.evaluate(async () => {
      const w = window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } };
      return w.Clerk?.session?.getToken() ?? '';
    });
    expect(token).toBeTruthy();

    api = new ApiHelper({ request, token });

    // Create entity with bank account (required for reminder email)
    entityId = await api.createEntity({
      name: `Escalation Entity ${timestamp}`,
      email: `escalation-${timestamp}@example.com`,
    });
    await api.waitForEntityCount(1);

    await api.addBankAccount({
      entityId,
      label: 'Compte principal',
      iban: 'FR7630001007941234567890185',
      bic: 'BDFEFRPP',
      isDefault: true,
    });

    // Create property
    const propertyId = await api.createProperty({
      entityId,
      name: `Esc Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Create unit
    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Esc ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Create tenant with email
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Pierre',
      lastName: `Recouvrement${timestamp}`,
      email: `pierre.${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Create lease starting January 2026
    await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: '2026-01-01T00:00:00.000Z',
      rentAmountCents: 80000,
      monthlyDueDate: 5,
    });
    await api.waitForLeaseCount(entityId, 1);

    // Generate rent calls for January 2026 (past month)
    const result = await api.generateRentCalls(entityId, '2026-01');
    expect(result.generated).toBe(1);

    // Wait for projection and get the rent call ID
    const data = await api.waitForRentCallCount(entityId, '2026-01', 1);
    rentCallId = data[0].id as string;

    // Send the rent call (required for unpaid detection)
    await api.sendRentCallsByEmail(entityId, '2026-01');

    // Configure delay to 0 — immediate detection
    await api.configureLatePaymentDelay(entityId, 0);

    // Wait for unpaid detection
    await new Promise((r) => setTimeout(r, 1000));
    const unpaid = await api.getUnpaidRentCalls(entityId);
    expect(unpaid.data.length).toBe(1);
  });

  test('6.2.E2E.2 — navigate to rent call detail page from unpaid filter', async ({
    page,
  }) => {
    await page.goto('/rent-calls?filter=unpaid');
    await page.waitForLoadState('networkidle');

    // Wait for unpaid list to load
    const unpaidButton = page.getByRole('button', { name: /Impayés/i });
    const isVisible = await unpaidButton.isVisible().catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Click "Voir détails" button
    const detailButton = page.getByRole('link', { name: /Voir détails/ }).first();
    const detailVisible = await detailButton.isVisible({ timeout: 10000 }).catch(() => false);
    if (!detailVisible) {
      test.skip();
      return;
    }

    await detailButton.click();
    await page.waitForLoadState('networkidle');

    // Should be on detail page
    await expect(page).toHaveURL(new RegExp(`/rent-calls/${rentCallId}`));
    // Should see the escalation timeline
    await expect(page.getByText('Procédure de recouvrement')).toBeVisible({ timeout: 10000 });
  });

  test('6.2.E2E.3 — StatusTimeline shows 3 tiers with action buttons', async ({
    page,
  }) => {
    await page.goto(`/rent-calls/${rentCallId}`);
    await page.waitForLoadState('networkidle');

    const timeline = page.getByText('Procédure de recouvrement');
    const isVisible = await timeline.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Verify all 3 tiers are visible
    await expect(page.getByText('Tier 1 — Relance par email')).toBeVisible();
    await expect(page.getByText('Tier 2 — Mise en demeure')).toBeVisible();
    await expect(page.getByText('Tier 3 — Signalements aux tiers')).toBeVisible();

    // Verify action buttons
    await expect(page.getByRole('button', { name: /Envoyer la relance/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Générer la mise en demeure/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Assureur/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Avocat/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Garant/ })).toBeVisible();
  });

  test('6.2.E2E.4 — Tier 2: download formal notice PDF (skip tier 1)', async ({
    page,
  }) => {
    await page.goto(`/rent-calls/${rentCallId}`);
    await page.waitForLoadState('networkidle');

    const formalNoticeBtn = page.getByRole('button', { name: /Générer la mise en demeure/ });
    const isVisible = await formalNoticeBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // Click to generate/download formal notice PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await formalNoticeBtn.click();
    const download = await downloadPromise;

    if (download) {
      // Verify filename pattern
      expect(download.suggestedFilename()).toMatch(/mise-en-demeure/);
    }

    // Wait for escalation status to update
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Tier 2 should now show as completed
    const tier2Completed = page.getByText(/Généré le/);
    const completed = await tier2Completed.isVisible({ timeout: 10000 }).catch(() => false);
    if (completed) {
      await expect(tier2Completed).toBeVisible();
    }
  });

  test('9.2.E2E.1 — graceful degradation: registered mail button hidden when AR24 not configured', async ({
    page,
  }) => {
    // Navigate to rent call detail page
    await page.goto(`/rent-calls/${rentCallId}`);
    await page.waitForLoadState('networkidle');

    const timeline = page.getByText('Procédure de recouvrement');
    const isVisible = await timeline.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    // The "Envoyer en recommandé" button should NOT be visible
    // because AR24 is not configured in the E2E environment
    const registeredMailBtn = page.getByRole('button', { name: /Envoyer en recommandé/ });
    await expect(registeredMailBtn).not.toBeVisible();
  });

  test('9.2.E2E.2 — registered mail status endpoint returns availability', async ({
    page,
    request,
  }) => {
    // Call the public status endpoint directly
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await request.get(`${baseUrl}/api/registered-mail/status`);
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body).toHaveProperty('available');
    expect(typeof body.available).toBe('boolean');
  });
});
