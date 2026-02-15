import { Event } from 'nestjs-cqrx';
import type { StatementPrimitives } from '../regularization-statement.js';

export interface ChargeRegularizationAppliedData {
  chargeRegularizationId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  statements: StatementPrimitives[];
  appliedAt: string;
}

export class ChargeRegularizationApplied extends Event<ChargeRegularizationAppliedData> {
  constructor(data: ChargeRegularizationAppliedData) {
    super(data);
  }
}
