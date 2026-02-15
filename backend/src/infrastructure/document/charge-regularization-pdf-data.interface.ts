export interface ChargeRegularizationPdfCharge {
  label: string;
  totalChargeCents: number;
  tenantShareCents: number;
  provisionsPaidCents: number;
  isWaterByConsumption: boolean;
}

export interface ChargeRegularizationPdfData {
  // Entity (sender)
  entityName: string;
  entityAddress: string;
  entitySiret: string | null;

  // Tenant (recipient)
  tenantName: string;
  tenantAddress: string;

  // Unit reference
  unitIdentifier: string;
  unitAddress: string;

  // Occupancy period
  occupancyStart: string; // DD/MM/YYYY
  occupancyEnd: string; // DD/MM/YYYY
  occupiedDays: number;
  daysInYear: number;

  // Charge breakdown
  charges: ChargeRegularizationPdfCharge[];
  totalShareCents: number;
  totalProvisionsPaidCents: number;
  balanceCents: number;

  // Document metadata
  fiscalYear: number;
  documentDate: string; // DD/MM/YYYY
}
