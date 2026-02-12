import type { PostalAddressPrimitives } from '../postal-address.js';

export class UpdateATenantCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly companyName?: string | null,
    public readonly siret?: string | null,
    public readonly email?: string,
    public readonly phoneNumber?: string | null,
    public readonly address?: PostalAddressPrimitives,
  ) {}
}
