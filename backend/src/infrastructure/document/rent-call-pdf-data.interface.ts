export interface RentCallPdfData {
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;
  tenantName: string;
  tenantAddress: string;
  unitIdentifier: string;
  leaseReference: string; // lease startDate formatted
  billingPeriod: string; // month label e.g. "Février 2026"
  dueDate: number; // day of month
  rentAmountCents: number;
  billingLines: Array<{ categoryLabel: string; amountCents: number }>;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
  iban: string | null;
  bic: string | null;
}
