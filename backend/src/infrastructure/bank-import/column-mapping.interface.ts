export interface ColumnMapping {
  dateColumn: string;
  amountColumn: string;
  payerColumn: string;
  referenceColumn: string;
  dateFormat?: string; // 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'YYYY-MM-DD'
  amountFormat?: 'european' | 'standard';
  skipHeaderRows?: number;
  debitColumn?: string; // For banks with separate debit/credit columns
  creditColumn?: string;
}

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  dateColumn: 'Date',
  amountColumn: 'Montant',
  payerColumn: 'Libellé',
  referenceColumn: 'Référence',
  dateFormat: 'DD/MM/YYYY',
  amountFormat: 'european',
  skipHeaderRows: 0,
};
