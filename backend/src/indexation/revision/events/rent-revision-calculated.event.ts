import { Event } from 'nestjs-cqrx';

export interface RentRevisionCalculatedData {
  revisionId: string;
  leaseId: string;
  entityId: string;
  userId: string;
  tenantId: string;
  unitId: string;
  tenantName: string;
  unitLabel: string;
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  baseIndexValue: number;
  baseIndexQuarter: string;
  newIndexValue: number;
  newIndexQuarter: string;
  newIndexYear: number;
  revisionIndexType: string;
  calculatedAt: string;
}

export class RentRevisionCalculated extends Event<RentRevisionCalculatedData> {
  constructor(data: RentRevisionCalculatedData) {
    super(data);
  }
}
