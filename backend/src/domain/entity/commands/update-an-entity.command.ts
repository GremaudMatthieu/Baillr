import type { AddressPrimitives } from '../address.js';

export class UpdateAnEntityCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly name?: string,
    public readonly siret?: string | null,
    public readonly address?: AddressPrimitives,
    public readonly legalInformation?: string | null,
  ) {}
}
