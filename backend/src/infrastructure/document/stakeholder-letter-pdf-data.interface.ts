export interface StakeholderLetterPdfData {
  recipientType: 'insurance' | 'lawyer' | 'guarantor';
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;
  tenantName: string;
  tenantAddress: string;
  leaseReference: string;
  unitIdentifier: string;
  totalDebtCents: number;
  unpaidPeriods: Array<{ period: string; amountCents: number }>;
  tier1SentAt: string | null;
  tier2SentAt: string | null;
  date: string;
}
