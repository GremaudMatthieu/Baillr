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
