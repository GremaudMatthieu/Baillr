import { Event } from 'nestjs-cqrx';

export interface ChargeRegularizationSentData {
  chargeRegularizationId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  sentCount: number;
  sentAt: string;
}

export class ChargeRegularizationSent extends Event<ChargeRegularizationSentData> {
  constructor(data: ChargeRegularizationSentData) {
    super(data);
  }
}
