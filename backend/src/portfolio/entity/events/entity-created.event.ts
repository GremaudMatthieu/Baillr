import { Event } from 'nestjs-cqrx';

export interface EntityCreatedData {
  id: string;
  userId: string;
  type: 'sci' | 'nom_propre';
  name: string;
  email?: string;
  siret: string | null;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
  legalInformation: string | null;
}

export class EntityCreated extends Event<EntityCreatedData> {
  constructor(data: EntityCreatedData) {
    super(data);
  }
}
