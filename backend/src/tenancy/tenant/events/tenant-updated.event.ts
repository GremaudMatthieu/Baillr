import { Event } from 'nestjs-cqrx';
import type { PostalAddressPrimitives } from '../postal-address.js';

export interface TenantUpdatedData {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  siret?: string | null;
  email?: string;
  phoneNumber?: string | null;
  address?: PostalAddressPrimitives;
}

export class TenantUpdated extends Event<TenantUpdatedData> {
  constructor(data: TenantUpdatedData) {
    super(data);
  }
}
