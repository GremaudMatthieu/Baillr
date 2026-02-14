export interface FormalNoticePdfData {
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;
  tenantName: string;
  tenantAddress: string;
  leaseReference: string;
  unitIdentifier: string;
  unpaidPeriods: Array<{ period: string; amountCents: number }>;
  totalDebtCents: number;
  tier1SentAt: string | null;
  date: string;
}
