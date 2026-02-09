import type { EntityTypeValue } from '../entity-type.js';
import type { AddressPrimitives } from '../address.js';

export class CreateAnEntityCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: EntityTypeValue,
    public readonly name: string,
    public readonly siret: string | null,
    public readonly address: AddressPrimitives,
    public readonly legalInformation: string | null,
  ) {}
}
