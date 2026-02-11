import type { PropertyAddressPrimitives } from '../property-address.js';

export class CreateAPropertyCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly entityId: string,
    public readonly name: string,
    public readonly type: string | null,
    public readonly address: PropertyAddressPrimitives,
  ) {}
}
