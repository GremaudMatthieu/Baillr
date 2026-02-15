import { Event } from 'nestjs-cqrx';

export interface ChargeRegularizationSettledData {
  chargeRegularizationId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  settledAt: string;
}

export class ChargeRegularizationSettled extends Event<ChargeRegularizationSettledData> {
  constructor(data: ChargeRegularizationSettledData) {
    super(data);
  }
}
