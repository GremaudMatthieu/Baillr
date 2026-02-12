import { Event } from 'nestjs-cqrx';
import type { PostalAddressPrimitives } from '../postal-address.js';

export interface TenantRegisteredData {
  id: string;
  entityId: string;
  userId: string;
  type: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  siret: string | null;
  email: string;
  phoneNumber: string | null;
  address: PostalAddressPrimitives;
  insuranceProvider?: string | null;
  policyNumber?: string | null;
  renewalDate?: string | null;
}

export class TenantRegistered extends Event<TenantRegisteredData> {
  constructor(data: TenantRegisteredData) {
    super(data);
  }
}
