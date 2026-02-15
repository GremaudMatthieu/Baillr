export interface StatementChargePrimitives {
  chargeCategoryId: string;
  label: string;
  totalChargeCents: number;
  tenantShareCents: number;
  isWaterByConsumption: boolean;
}

export interface StatementPrimitives {
  leaseId: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitIdentifier: string;
  occupancyStart: string;
  occupancyEnd: string;
  occupiedDays: number;
  daysInYear: number;
  charges: StatementChargePrimitives[];
  totalShareCents: number;
  totalProvisionsPaidCents: number;
  balanceCents: number;
}
