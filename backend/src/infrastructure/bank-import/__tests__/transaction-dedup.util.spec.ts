import {
  buildTransactionKey,
  buildExistingKeySet,
  markDuplicates,
} from '../transaction-dedup.util.js';
import type { ParsedTransaction } from '../parsed-transaction.interface.js';

describe('transaction-dedup.util', () => {
  describe('buildTransactionKey', () => {
    it('should build composite key with date normalized to YYYY-MM-DD', () => {
      const key = buildTransactionKey('2026-02-15T00:00:00.000Z', 85000, 'LOYER-FEV');
      expect(key).toBe('2026-02-15|85000|LOYER-FEV');
    });

    it('should handle date-only strings without T separator', () => {
      const key = buildTransactionKey('2026-02-15', 85000, 'LOYER-FEV');
      expect(key).toBe('2026-02-15|85000|LOYER-FEV');
    });

    it('should handle negative amounts', () => {
      const key = buildTransactionKey('2026-02-10T00:00:00.000Z', -12050, 'EDF');
      expect(key).toBe('2026-02-10|-12050|EDF');
    });
  });

  describe('buildExistingKeySet', () => {
    it('should build a Set from DB rows', () => {
      const rows = [
        { date: new Date('2026-02-15'), amountCents: 85000, reference: 'REF-1' },
        { date: new Date('2026-02-16'), amountCents: 50000, reference: 'REF-2' },
      ];

      const keys = buildExistingKeySet(rows);

      expect(keys.size).toBe(2);
      expect(keys.has('2026-02-15|85000|REF-1')).toBe(true);
      expect(keys.has('2026-02-16|50000|REF-2')).toBe(true);
    });

    it('should return empty Set for empty input', () => {
      expect(buildExistingKeySet([]).size).toBe(0);
    });
  });

  describe('markDuplicates', () => {
    it('should flag matching transactions as duplicates', () => {
      const existingDate = new Date('2026-02-15');
      const existingKeys = buildExistingKeySet([
        { date: existingDate, amountCents: 85000, reference: 'LOYER' },
      ]);

      const transactions: ParsedTransaction[] = [
        {
          date: existingDate.toISOString(),
          amountCents: 85000,
          payerName: 'DUPONT',
          reference: 'LOYER',
          rawLine: {},
        },
        {
          date: existingDate.toISOString(),
          amountCents: 50000,
          payerName: 'MARTIN',
          reference: 'NEW-REF',
          rawLine: {},
        },
      ];

      markDuplicates(transactions, existingKeys);

      expect(transactions[0].isDuplicate).toBe(true);
      expect(transactions[1].isDuplicate).toBeUndefined();
    });

    it('should not modify transactions when no duplicates', () => {
      const existingKeys = buildExistingKeySet([]);
      const transactions: ParsedTransaction[] = [
        {
          date: '2026-02-15T00:00:00.000Z',
          amountCents: 85000,
          payerName: 'DUPONT',
          reference: 'REF',
          rawLine: {},
        },
      ];

      markDuplicates(transactions, existingKeys);

      expect(transactions[0].isDuplicate).toBeUndefined();
    });
  });
});
