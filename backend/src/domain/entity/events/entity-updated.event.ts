import { Event } from 'nestjs-cqrx';

export interface EntityUpdatedData {
  id: string;
  name?: string;
  siret?: string | null;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
  legalInformation?: string | null;
}

export class EntityUpdated extends Event<EntityUpdatedData> {
  constructor(data: EntityUpdatedData) {
    super(data);
  }
}
