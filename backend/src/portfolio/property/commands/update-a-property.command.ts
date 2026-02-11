import type { PropertyAddressPrimitives } from '../property-address.js';

export class UpdateAPropertyCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly type?: string | null,
    public readonly address?: PropertyAddressPrimitives,
  ) {}
}
