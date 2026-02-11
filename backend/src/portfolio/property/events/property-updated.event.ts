import { Event } from 'nestjs-cqrx';

export interface PropertyUpdatedData {
  id: string;
  name?: string;
  type?: string | null;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement: string | null;
  };
}

export class PropertyUpdated extends Event<PropertyUpdatedData> {
  constructor(data: PropertyUpdatedData) {
    super(data);
  }
}
