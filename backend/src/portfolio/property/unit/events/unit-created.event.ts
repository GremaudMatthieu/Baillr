import { Event } from 'nestjs-cqrx';

export interface UnitCreatedData {
  id: string;
  propertyId: string;
  userId: string;
  identifier: string;
  type: string;
  floor: number | null;
  surfaceArea: number;
  billableOptions: Array<{ label: string; amountCents: number }>;
}

export class UnitCreated extends Event<UnitCreatedData> {
  constructor(data: UnitCreatedData) {
    super(data);
  }
}
