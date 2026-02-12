import { Event } from 'nestjs-cqrx';

export interface RentCallGeneratedData {
  rentCallId: string;
  entityId: string;
  userId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  month: string;
  rentAmountCents: number;
  billingLines: Array<{ label: string; amountCents: number; type: string }>;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number;
  totalDaysInMonth: number;
}

export class RentCallGenerated extends Event<RentCallGeneratedData> {
  constructor(data: RentCallGeneratedData) {
    super(data);
  }
}
