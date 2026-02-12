export interface RentCallItemData {
  id: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  rentAmountCents: number;
  billingLines: Array<{ label: string; amountCents: number; type: string }>;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number;
  totalDaysInMonth: number;
}

export interface BatchHandlerResult {
  generated: number;
  totalAmountCents: number;
  exceptions: string[];
}

export class GenerateRentCallsForMonthCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly month: string,
    public readonly rentCallData: RentCallItemData[],
  ) {}
}
