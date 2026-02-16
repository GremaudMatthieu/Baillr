export interface AccountBookExcelEntry {
  date: string; // DD/MM/YYYY format
  category: string; // French label (not raw key)
  description: string;
  tenantName: string;
  debitEuros: number | null; // null if credit
  creditEuros: number | null; // null if debit
  balanceEuros: number;
}

export interface AccountBookExcelData {
  entityName: string;
  dateRange: string; // "01/01/2025 — 31/12/2025" or "Toutes les dates"
  exportDate: string; // DD/MM/YYYY
  entries: AccountBookExcelEntry[];
  entriesByCategory: Record<string, AccountBookExcelEntry[]>;
  totalDebitEuros: number;
  totalCreditEuros: number;
  totalBalanceEuros: number;
}
