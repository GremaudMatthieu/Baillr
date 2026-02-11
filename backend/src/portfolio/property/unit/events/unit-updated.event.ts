import { Event } from 'nestjs-cqrx';

export interface UnitUpdatedData {
  id: string;
  identifier?: string;
  type?: string;
  floor?: number | null;
  surfaceArea?: number;
  billableOptions?: Array<{ label: string; amountCents: number }>;
}

export class UnitUpdated extends Event<UnitUpdatedData> {
  constructor(data: UnitUpdatedData) {
    super(data);
  }
}
