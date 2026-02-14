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

test.describe('Manual payment recording', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let api: ApiHelper;

  test('5.4.1 — seed entity, property, unit, tenant, lease, rent call via API', async ({
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
      name: `Manual Pay ${timestamp}`,
    });
    await api.waitForEntityCount(1);

    const propertyId = await api.createProperty({
      entityId,
      name: `Prop ${timestamp}`,
    });
    await api.waitForPropertyCount(entityId, 1);

    const unitId = await api.createUnit({
      propertyId,
      identifier: `Apt Cash ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Paul',
      lastName: 'Lecash',
      email: `lecash-${timestamp}@test.com`,
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
      rentAmountCents: 60000,
    });
    await api.waitForLeaseCount(entityId, 1);

    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);
  });

  test('5.4.2 — record cash payment via rent calls page', async ({ page }) => {
    await page.goto('/rent-calls');

    // Wait for rent call list
    await expect(page.getByText('Paul Lecash')).toBeVisible({ timeout: 10000 });

    // Click record payment button
    await page.getByRole('button', { name: /Enregistrer un paiement/i }).click();

    // Dialog should open
    await expect(
      page.getByText('Enregistrer un paiement'),
    ).toBeVisible();

    // Payer name should be pre-filled
    const payerInput = page.getByLabel('Nom du payeur');
    await expect(payerInput).toHaveValue('Paul Lecash');

    // Amount should be pre-filled (600.00)
    const amountInput = page.getByLabel('Montant (€)');
    await expect(amountInput).toHaveValue('600.00');

    // Submit with default values (cash)
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Wait for dialog to close and payment to be recorded
    await expect(page.getByText(/Payé le/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Payment validation', () => {
  test.describe.configure({ mode: 'serial' });

  const timestamp = Date.now();
  let entityId: string;
  let bankAccountId: string;
  let bankStatementId: string;
  let api: ApiHelper;

  test('5.3.1 — seed full data and trigger matching', async ({
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
      name: `Validation Entity ${timestamp}`,
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
      identifier: `Apt Val ${timestamp}`,
    });
    await api.waitForUnitCount(propertyId, 1);

    // Tenant
    const tenantId = await api.registerTenant({
      entityId,
      firstName: 'Marie',
      lastName: 'Martin',
      email: `martin-${timestamp}@test.com`,
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
      rentAmountCents: 75000,
    });
    await api.waitForLeaseCount(entityId, 1);

    // Generate rent call
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    await api.generateRentCalls(entityId, month);
    await api.waitForRentCallCount(entityId, month, 1);

    // Import matching bank statement
    const mm = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const yyyy = String(currentMonth.getFullYear());
    const csvContent = `Date,Montant,Libellé,Référence\n15/${mm}/${yyyy},"750,00",MARTIN MARIE,LOYER-${mm}\n16/${mm}/${yyyy},"-30,00",INCONNU,REF-Y`;
    const importResult = await api.importBankStatement(
      entityId,
      bankAccountId,
      csvContent,
      `val-releve-${timestamp}.csv`,
    );
    bankStatementId = importResult.bankStatementId;
    await api.waitForBankStatementCount(entityId, 1);
  });

  test('5.3.2 — validate a matched payment via UI', async ({ page }) => {
    await page.goto('/payments');

    // Select statement
    const statementSelect = page.getByLabel('Sélectionner un relevé bancaire');
    await statementSelect.click();
    await page.getByRole('option').first().click();

    // Click match
    await page.getByRole('button', { name: /Lancer le rapprochement/i }).click();

    // Wait for matching results
    await expect(page.getByText('Rapprochements proposés')).toBeVisible({
      timeout: 15000,
    });

    // Validate the matched proposal (multiple rows may have this label)
    const validateBtn = page.getByLabel('Valider le rapprochement').first();
    await validateBtn.click();

    // Row should show validated state
    await expect(page.getByText('Validé')).toBeVisible({ timeout: 5000 });
  });

  test('5.3.3 — reject an unmatched transaction via UI', async ({ page }) => {
    await page.goto('/payments');

    // Re-run matching to get fresh results
    const statementSelect = page.getByLabel('Sélectionner un relevé bancaire');
    await statementSelect.click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /Lancer le rapprochement/i }).click();

    // Wait for results
    await expect(
      page.getByText(/non rapproché/),
    ).toBeVisible({ timeout: 15000 });

    // Find and click reject button on unmatched row
    const rejectBtns = page.getByLabel('Rejeter le rapprochement');
    await expect(rejectBtns.first()).toBeVisible({ timeout: 5000 });
    await rejectBtns.last().click();
    // Should show rejected state
    await expect(page.getByText('Rejeté')).toBeVisible({ timeout: 5000 });
  });

  test('5.3.4 — stepper shows validation progress', async ({ page }) => {
    await page.goto('/payments');

    // Stepper should be visible
    await expect(
      page.getByRole('list', { name: 'Étapes du cycle mensuel' }),
    ).toBeVisible({ timeout: 10000 });

    // Import step should show completed (has statements)
    await expect(page.getByText('Fichier chargé')).toBeVisible();
  });
});
