import { test, expect } from './fixtures/auth.fixture';
import { ApiHelper } from './fixtures/api.fixture';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

test.describe('Bank statement import', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let bankAccountId: string;
  let api: ApiHelper;

  test('5.1.1 — seed entity with bank account via API', async ({
    page,
    request,
  }) => {
    // Get token from Clerk
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
      name: `BS Entity ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Add bank account
    bankAccountId = await api.addBankAccount({
      entityId,
      label: `Compte ${timestamp}`,
      iban: 'FR7612345678901234567890189',
      bic: 'BNPAFRPP',
      bankName: 'BNP',
    });
  });

  test('5.1.2 — payments page shows empty state', async ({ page }) => {
    await page.goto('/payments');

    await expect(
      page.getByText('Aucun relevé bancaire importé'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Importer un relevé/i }),
    ).toBeVisible();
  });

  test('5.1.3 — import CSV file via dialog', async ({ page }) => {
    // Create a temporary CSV file
    const csvContent =
      'Date,Montant,Libellé,Référence\n15/02/2026,"850,00",DUPONT JEAN,LOYER-FEV\n16/02/2026,"-120,00",EDF,ELEC-0216';
    const tmpDir = os.tmpdir();
    const csvPath = path.join(tmpDir, `releve-${timestamp}.csv`);
    fs.writeFileSync(csvPath, csvContent);

    try {
      await page.goto('/payments');

      // Click import button
      await page.getByRole('button', { name: /Importer un relevé/i }).first().click();

      // Dialog should open
      await expect(
        page.getByText('Importer un relevé bancaire'),
      ).toBeVisible();

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(csvPath);

      // Select bank account
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: new RegExp(`Compte ${timestamp}`) }).click();

      // Click import
      await page.getByRole('button', { name: 'Importer' }).click();

      // Should show import summary
      await expect(page.getByText('Import réussi')).toBeVisible({ timeout: 10000 });
    } finally {
      // Clean up temp file even on test failure
      if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
    }
  });

  test('5.1.4 — transaction list shows imported data', async ({ page }) => {
    await page.goto('/payments');

    // Should see statement in list (wait for projection)
    await expect(
      page.getByText(new RegExp(`releve-${timestamp}\\.csv`)),
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Payment matching', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let bankAccountId: string;
  let bankStatementId: string;
  let api: ApiHelper;

  test('5.2.1 — seed full data via API (entity, property, unit, tenant, lease, rent call, bank statement)', async ({
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

    // Create entity
    entityId = await api.createEntity({
      name: `Match Entity ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    // Bank account
    bankAccountId = await api.addBankAccount({
      entityId,
      label: `Compte ${timestamp}`,
      iban: 'FR7612345678901234567890189',
      bic: 'BNPAFRPP',
      bankName: 'BNP',
    });

    // Property
    const propertyId = await api.createProperty({
      entityId,
      name: `Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    // Unit
    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Match ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Tenant
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: `dupont-${timestamp}@test.com`,
    });
    await api.waitForTenantCount(entityId, 1);

    // Lease
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

    // Generate rent call
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);

    // Import matching bank statement (dynamic dates matching current month)
    const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const yyyy = String(currentMonth.getFullYear());
    const csvContent = `Date,Montant,Libellé,Référence\n15/${mm}/${yyyy},"850,00",DUPONT JEAN,LOYER-${mm}\n16/${mm}/${yyyy},"-50,00",INCONNU,REF-X`;
    const importResult = await api.importBankStatement(
      entityId,
      bankAccountId,
      csvContent,
      `match-releve-${timestamp}.csv`,
    );
    bankStatementId = importResult.bankStatementId;
    await api.waitForBankStatementCount(entityId, 1);
  });

  test('5.2.2 — trigger matching and verify proposals via API', async () => {
    const currentMonth = new Date();
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;

    const result = await api.matchPayments(entityId, bankStatementId, month);

    // Verify matching results
    expect(result.summary.matched).toBeGreaterThanOrEqual(1);
    expect(result.summary.unmatched).toBeGreaterThanOrEqual(1);
    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.unmatched.length).toBeGreaterThanOrEqual(1);
  });

  test('5.2.3 — payments page shows rapprochement section', async ({
    page,
  }) => {
    await page.goto('/payments');

    // Wait for the matching section to be visible
    await expect(page.getByText('Rapprochement')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByRole('button', { name: /Lancer le rapprochement/i }),
    ).toBeVisible();
  });
});
