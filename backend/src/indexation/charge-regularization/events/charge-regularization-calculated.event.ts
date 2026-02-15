import { Event } from 'nestjs-cqrx';
import type { StatementPrimitives } from '../regularization-statement.js';

export interface ChargeRegularizationCalculatedData {
  chargeRegularizationId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  statements: StatementPrimitives[];
  totalBalanceCents: number;
  calculatedAt: string;
}

export class ChargeRegularizationCalculated extends Event<ChargeRegularizationCalculatedData> {
  constructor(data: ChargeRegularizationCalculatedData) {
    super(data);
  }
}
