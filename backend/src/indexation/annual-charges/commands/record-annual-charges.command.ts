import type { ChargeEntryPrimitives } from '../charge-entry.js';

export class RecordAnnualChargesCommand {
  constructor(
    public readonly id: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
    public readonly charges: ChargeEntryPrimitives[],
  ) {}
}
