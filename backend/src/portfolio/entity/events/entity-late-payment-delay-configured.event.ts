import { Event } from 'nestjs-cqrx';

export interface EntityLatePaymentDelayConfiguredData {
  id: string;
  latePaymentDelayDays: number;
}

export class EntityLatePaymentDelayConfigured extends Event<EntityLatePaymentDelayConfiguredData> {
  constructor(data: EntityLatePaymentDelayConfiguredData) {
    super(data);
  }
}
