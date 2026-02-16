import { AccountBookExcelAssembler } from '../assemblers/account-book-excel.assembler';
import type { AccountEntryWithTenant } from '../finders/accounting.finder';

describe('AccountBookExcelAssembler', () => {
  let assembler: AccountBookExcelAssembler;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-16T12:00:00Z'));
    assembler = new AccountBookExcelAssembler();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function buildEntry(
    overrides: Partial<AccountEntryWithTenant> = {},
  ): AccountEntryWithTenant {
    return {
      id: 'ae-1',
      entityId: 'entity-1',
      tenantId: 'tenant-1',
      type: 'debit',
      category: 'rent_call',
      description: 'Appel de loyer - 2026-01',
      amountCents: 80000,
      balanceCents: 80000,
      referenceId: 'rc-1',
      referenceMonth: '2026-01',
      entryDate: new Date('2026-01-05T00:00:00.000Z'),
      createdAt: new Date('2026-01-05T00:00:00.000Z'),
      tenant: {
        firstName: 'Jean',
        lastName: 'Dupont',
        companyName: null,
        type: 'individual',
      },
      ...overrides,
    } as AccountEntryWithTenant;
  }

  it('should convert cents to euros', () => {
    const entries = [buildEntry({ amountCents: 85050, balanceCents: 85050 })];
    const result = assembler.assemble(
      { name: 'SCI Test' },
      entries,
      {},
    );

    expect(result.entries[0].debitEuros).toBe(850.5);
    expect(result.entries[0].balanceEuros).toBe(850.5);
  });

  it('should map debit type to debitEuros and null creditEuros', () => {
    const entries = [buildEntry({ type: 'debit', amountCents: 80000 })];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].debitEuros).toBe(800);
    expect(result.entries[0].creditEuros).toBeNull();
  });

  it('should map credit type to creditEuros and null debitEuros', () => {
    const entries = [buildEntry({ type: 'credit', category: 'payment', amountCents: 80000 })];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].debitEuros).toBeNull();
    expect(result.entries[0].creditEuros).toBe(800);
  });

  it('should translate category keys to French labels', () => {
    const entries = [
      buildEntry({ category: 'rent_call' }),
      buildEntry({ id: 'ae-2', category: 'payment', type: 'credit' }),
      buildEntry({ id: 'ae-3', category: 'overpayment_credit', type: 'credit' }),
      buildEntry({ id: 'ae-4', category: 'charge_regularization' }),
      buildEntry({ id: 'ae-5', category: 'adjustment' }),
    ];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].category).toBe('Appel de loyer');
    expect(result.entries[1].category).toBe('Paiement');
    expect(result.entries[2].category).toBe('Trop-perçu');
    expect(result.entries[3].category).toBe('Régularisation');
    expect(result.entries[4].category).toBe('Ajustement');
  });

  it('should format tenant name (individual)', () => {
    const entries = [buildEntry()];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].tenantName).toBe('Jean Dupont');
  });

  it('should format tenant name (company)', () => {
    const entries = [
      buildEntry({
        tenant: {
          firstName: 'Marie',
          lastName: 'Martin',
          companyName: 'SAS Immobilière',
          type: 'company',
        },
      }),
    ];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].tenantName).toBe('SAS Immobilière');
  });

  it('should format dates as DD/MM/YYYY UTC', () => {
    const entries = [buildEntry({ entryDate: new Date('2026-01-05T00:00:00.000Z') })];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.entries[0].date).toBe('05/01/2026');
    expect(result.exportDate).toBe('16/02/2026');
  });

  it('should group entries by category in defined order', () => {
    const entries = [
      buildEntry({ category: 'payment', type: 'credit', id: 'ae-2' }),
      buildEntry({ category: 'rent_call', id: 'ae-1' }),
    ];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    const keys = Object.keys(result.entriesByCategory);
    expect(keys[0]).toBe('Appel de loyer'); // rent_call comes first in CATEGORY_ORDER
    expect(keys[1]).toBe('Paiement');
  });

  it('should build date range from filters', () => {
    const entries = [buildEntry()];
    const result = assembler.assemble(
      { name: 'Test' },
      entries,
      { startDate: '2026-01-01', endDate: '2026-12-31' },
    );

    expect(result.dateRange).toBe('01/01/2026 — 31/12/2026');
  });

  it('should show "Toutes les dates" when no date filters', () => {
    const entries = [buildEntry()];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.dateRange).toBe('Toutes les dates');
  });

  it('should compute total debits and credits', () => {
    const entries = [
      buildEntry({ type: 'debit', amountCents: 80000, balanceCents: 80000 }),
      buildEntry({ id: 'ae-2', type: 'credit', category: 'payment', amountCents: 50000, balanceCents: 30000 }),
    ];
    const result = assembler.assemble({ name: 'Test' }, entries, {});

    expect(result.totalDebitEuros).toBe(800);
    expect(result.totalCreditEuros).toBe(500);
    expect(result.totalBalanceEuros).toBe(300); // last entry balance
  });

  it('should build sanitized filename with exact date', () => {
    const filename = assembler.buildFilename('SCI Les Oliviers');

    expect(filename).toBe('livre-comptes-sci_les_oliviers-2026-02-16.xlsx');
  });

  it('should handle empty entries', () => {
    const result = assembler.assemble({ name: 'Test' }, [], {});

    expect(result.entries).toEqual([]);
    expect(result.entriesByCategory).toEqual({});
    expect(result.totalDebitEuros).toBe(0);
    expect(result.totalCreditEuros).toBe(0);
    expect(result.totalBalanceEuros).toBe(0);
  });
});
