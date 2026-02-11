import { Event } from 'nestjs-cqrx';

export interface PropertyCreatedData {
  id: string;
  entityId: string;
  userId: string;
  name: string;
  type: string | null;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
}

export class PropertyCreated extends Event<PropertyCreatedData> {
  constructor(data: PropertyCreatedData) {
    super(data);
  }
}
