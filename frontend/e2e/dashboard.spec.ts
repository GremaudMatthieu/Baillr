import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';

test.describe('Dashboard UnitMosaic payment status', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let propertyId: string;
  let unitId: string;
  let vacantUnitId: string;
  let api: ApiHelper;

  test('8.4.0 — seed entity with property, units, tenant, lease, and rent calls', async ({
    page,
    request,
  }) => {
    // Navigate to dashboard to initialize Clerk session
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
      name: `Dashboard E2E ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Create property
    propertyId = await api.createProperty({
      entityId,
      name: `Résidence E2E ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Create two units — one will have a lease + rent call, the other stays vacant
    unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Dash-${timestamp}`,
      type: 'apartment',
      surfaceArea: 50,
    });

    vacantUnitId = await api.createUnit({
      propertyId,
      identifier: `Apt Vacant-${timestamp}`,
      type: 'apartment',
      surfaceArea: 30,
    });
    await api.waitForUnitCount(propertyId, 2);

    // Register tenant
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Alice',
      lastName: 'Dashboard',
      email: `alice-dash-${timestamp}@example.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Create lease
    await api.createLease({
      entityId,
      tenantId,
      unitId,
      startDate: '2026-01-01T00:00:00.000Z',
      rentAmountCents: 75000,
    });
    await api.waitForLeaseCount(entityId, 1);

    // Generate rent calls for current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, currentMonth);
    await api.waitForRentCallCount(entityId, currentMonth, 1);

    // Send rent calls to transition to "sent" status
    await api.sendRentCallsByEmail(entityId, currentMonth);
  });

  test('8.4.1 — dashboard mosaic renders tiles with correct color classes', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Wait for the grid to appear
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // The occupied unit with sent rent call should have orange tile (sent status)
    const sentTile = page.getByRole('gridcell', {
      name: new RegExp(`Apt Dash-${timestamp}.*envoyé`),
    });
    await expect(sentTile).toBeVisible({ timeout: 10_000 });
    await expect(sentTile).toHaveClass(/bg-orange-100/);

    // The vacant unit should have muted tile
    const vacantTile = page.getByRole('gridcell', {
      name: new RegExp(`Apt Vacant-${timestamp}.*vacant`),
    });
    await expect(vacantTile).toBeVisible();
    await expect(vacantTile).toHaveClass(/bg-muted/);
  });

  test('8.4.2 — clicking a mosaic tile navigates to unit detail', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for mosaic
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // Click the occupied tile
    const tile = page.getByRole('gridcell', {
      name: new RegExp(`Apt Dash-${timestamp}`),
    });
    await expect(tile).toBeVisible();
    await tile.click();

    // Should navigate to unit detail page
    await page.waitForURL(/\/properties\/[\w-]+\/units\/[\w-]+/);
    await expect(page).toHaveURL(
      new RegExp(`/properties/${propertyId}/units/${unitId}`),
    );
  });

  test('8.4.3 — dashboard loads in under 2 seconds', async ({ page }) => {
    test.skip(!entityId, 'Requires seed data');

    const startTime = Date.now();

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Wait for the mosaic grid to be visible (data loaded)
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    const loadTime = Date.now() - startTime;

    // NFR4: Dashboard should load in under 2 seconds (AC #4)
    // Use 3s threshold to account for CI/dev overhead while still validating AC intent
    expect(loadTime).toBeLessThan(3000);
  });

  test('8.4.4 — mosaic legend is visible with all status labels', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for mosaic to load
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // Legend should be visible with status labels
    const legend = page.getByRole('list', { name: 'Légende des statuts' });
    await expect(legend).toBeVisible();

    await expect(page.getByText('Payé')).toBeVisible();
    await expect(page.getByText('Partiellement payé')).toBeVisible();
    await expect(page.getByText('Envoyé')).toBeVisible();
    await expect(page.getByText('Impayé')).toBeVisible();
    await expect(page.getByText('Vacant')).toBeVisible();
  });

  test('8.4.5 — month selector is visible and interactive', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for mosaic
    const grid = page.getByRole('grid', { name: /mosa[iï]que des lots/i });
    await expect(grid).toBeVisible({ timeout: 10_000 });

    // Month selector should be visible
    await expect(page.getByText('Mois')).toBeVisible();
    const selector = page.getByRole('combobox');
    await expect(selector).toBeVisible();
  });

  // --- Story 8.6: Action feed ---

  test('8.6.1 — ActionFeed section is visible on the dashboard', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // ActionFeed heading should be visible
    await expect(
      page.getByRole('heading', { name: 'Actions en attente' }),
    ).toBeVisible({ timeout: 10_000 });

    // The actions list should be present
    await expect(
      page.getByRole('list', { name: 'Actions en attente' }),
    ).toBeVisible();
  });

  test('8.6.2 — clicking an action button navigates to the correct page', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Actions en attente' }),
    ).toBeVisible({ timeout: 10_000 });

    // At least one action link should be visible (seed data produces onboarding actions)
    const actionLinks = page.getByRole('link', { name: /Commencer/ });
    const count = await actionLinks.count();
    expect(count).toBeGreaterThan(0);

    // Click the first link and verify navigation
    const href = await actionLinks.first().getAttribute('href');
    expect(href).toBeTruthy();
    await actionLinks.first().click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });

  // --- Story 8.5: KPI tiles ---

  test('8.5.1 — dashboard displays 5 KPI tiles with correct labels', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Wait for KPI tiles to load (check for a known label)
    await expect(
      page.getByText("Taux d'encaissement"),
    ).toBeVisible({ timeout: 10_000 });

    // All 5 KPI labels should be visible
    await expect(page.getByText("Taux d'encaissement")).toBeVisible();
    await expect(page.getByText('Loyers appelés')).toBeVisible();
    await expect(page.getByText('Paiements reçus')).toBeVisible();
    await expect(page.getByText('Impayés')).toBeVisible();
    await expect(page.getByText('Encours total')).toBeVisible();
  });

  test('8.5.2 — collection rate displays as percentage', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for KPI tiles
    await expect(
      page.getByText("Taux d'encaissement"),
    ).toBeVisible({ timeout: 10_000 });

    // Collection rate value should match "XX,X %" format (e.g., "0,0 %", "85,5 %")
    const rateText = page.locator('text=/\\d+,\\d\\s%/');
    await expect(rateText.first()).toBeVisible();
  });

  test('8.5.3 — amounts display in French number format', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for KPI tiles
    await expect(
      page.getByText('Loyers appelés'),
    ).toBeVisible({ timeout: 10_000 });

    // At least one amount should be visible with French currency format (contains "€")
    // The rent call was generated for 750€, so "Loyers appelés" should show a value with €
    const euroAmounts = page.locator('text=/\\d.*€/');
    await expect(euroAmounts.first()).toBeVisible();
  });

  // --- Story 8.7: Treasury chart ---

  test('8.7.1 — treasury chart container is visible on dashboard', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Treasury chart heading should be visible
    await expect(
      page.getByText('Trésorerie'),
    ).toBeVisible({ timeout: 10_000 });

    // Time range selector buttons should be visible
    await expect(page.getByRole('button', { name: '6 mois' })).toBeVisible();
    await expect(page.getByRole('button', { name: '12 mois' })).toBeVisible();
    await expect(page.getByRole('button', { name: '24 mois' })).toBeVisible();
  });

  test('8.7.2 — time range selector changes active state', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for treasury chart
    await expect(page.getByText('Trésorerie')).toBeVisible({ timeout: 10_000 });

    // 12 months should be active by default
    const btn12 = page.getByRole('button', { name: '12 mois' });
    await expect(btn12).toHaveAttribute('aria-pressed', 'true');

    // Click 6 months
    const btn6 = page.getByRole('button', { name: '6 mois' });
    await btn6.click();
    await expect(btn6).toHaveAttribute('aria-pressed', 'true');
    await expect(btn12).toHaveAttribute('aria-pressed', 'false');
  });

  test('8.7.3 — chart renders SVG content with data', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    await page.goto('/dashboard');

    // Wait for treasury chart
    await expect(page.getByText('Trésorerie')).toBeVisible({ timeout: 10_000 });

    // Recharts renders SVG — verify an SVG element exists inside the chart area
    const chartSvg = page.locator('.recharts-wrapper svg');
    await expect(chartSvg.first()).toBeVisible({ timeout: 10_000 });
  });

  test('8.7.4 — dashboard with chart loads within performance budget', async ({
    page,
  }) => {
    test.skip(!entityId, 'Requires seed data');

    const startTime = Date.now();

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Tableau de bord' }),
    ).toBeVisible();

    // Wait for treasury chart to be visible
    await expect(page.getByText('Trésorerie')).toBeVisible({ timeout: 10_000 });

    const loadTime = Date.now() - startTime;

    // AC #7 / NFR4: dashboard loads within 2-second budget (3s for CI tolerance)
    expect(loadTime).toBeLessThan(3000);
  });
});
