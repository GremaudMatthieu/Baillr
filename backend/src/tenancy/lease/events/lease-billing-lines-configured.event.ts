import { Event } from 'nestjs-cqrx';
import { BillingLinePrimitives } from '../billing-line.js';

export interface LeaseBillingLinesConfiguredData {
  leaseId: string;
  billingLines: BillingLinePrimitives[];
}

export class LeaseBillingLinesConfigured extends Event<LeaseBillingLinesConfiguredData> {
  constructor(data: LeaseBillingLinesConfiguredData) {
    super(data);
  }
}
