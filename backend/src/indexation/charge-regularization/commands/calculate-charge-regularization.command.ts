import type { StatementPrimitives } from '../regularization-statement.js';

export class CalculateChargeRegularizationCommand {
  constructor(
    public readonly id: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
    public readonly statements: StatementPrimitives[],
  ) {}
}
