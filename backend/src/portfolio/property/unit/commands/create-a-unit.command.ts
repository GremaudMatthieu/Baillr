import type { BillableOptionPrimitives } from '../billable-option.js';

export class CreateAUnitCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly propertyId: string,
    public readonly identifier: string,
    public readonly type: string,
    public readonly floor: number | null,
    public readonly surfaceArea: number,
    public readonly billableOptions: BillableOptionPrimitives[],
  ) {}
}
