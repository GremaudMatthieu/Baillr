import { Event } from 'nestjs-cqrx';

export interface AnnualChargesRecordedData {
  annualChargesId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  charges: Array<{
    category: string;
    label: string;
    amountCents: number;
  }>;
  totalAmountCents: number;
  recordedAt: string;
}

export class AnnualChargesRecorded extends Event<AnnualChargesRecordedData> {
  constructor(data: AnnualChargesRecordedData) {
    super(data);
  }
}
