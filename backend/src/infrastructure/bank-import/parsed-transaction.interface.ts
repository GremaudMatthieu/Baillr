export interface ParsedTransaction {
  date: string; // ISO date string
  amountCents: number; // Positive for credits, negative for debits
  payerName: string;
  reference: string;
  rawLine: Record<string, string>;
  isDuplicate?: boolean; // Flagged when same date+amount+reference appears multiple times in the same import
}
