import type { ParsedTransaction } from './parsed-transaction.interface.js';

/** Composite key used for cross-import duplicate detection. Dates are normalized to YYYY-MM-DD. */
export function buildTransactionKey(date: string, amountCents: number, reference: string): string {
  const normalizedDate = date.includes('T') ? date.split('T')[0] : date;
  return `${normalizedDate}|${amountCents}|${reference}`;
}

/**
 * Builds a Set of composite keys from existing DB transactions.
 * Each row must have { date: Date, amountCents: number, reference: string }.
 */
export function buildExistingKeySet(
  rows: { date: Date; amountCents: number; reference: string }[],
): Set<string> {
  return new Set(
    rows.map((t) => buildTransactionKey(t.date.toISOString().split('T')[0], t.amountCents, t.reference)),
  );
}

/**
 * Flags `isDuplicate = true` on parsed transactions whose composite key
 * already exists in the provided Set.
 */
export function markDuplicates(
  transactions: ParsedTransaction[],
  existingKeys: Set<string>,
): void {
  for (const t of transactions) {
    if (existingKeys.has(buildTransactionKey(t.date, t.amountCents, t.reference))) {
      t.isDuplicate = true;
    }
  }
}
