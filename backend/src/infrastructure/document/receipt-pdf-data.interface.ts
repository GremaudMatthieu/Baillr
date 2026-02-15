export interface ReceiptPdfData {
  receiptType: 'quittance' | 'recu_paiement';
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;
  tenantName: string;
  tenantAddress: string;
  unitIdentifier: string;
  leaseReference: string; // lease startDate formatted DD/MM/YYYY
  billingPeriod: string; // month label e.g. "Février 2026"
  rentAmountCents: number;
  billingLines: Array<{ categoryLabel: string; amountCents: number }>;
  totalAmountCents: number;
  totalPaidCents: number;
  remainingBalanceCents: number;
  paymentDate: string; // last payment date formatted DD/MM/YYYY
  payments: Array<{
    date: string;
    amountCents: number;
    method: string;
  }>;
  iban: string | null;
  bic: string | null;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
}
