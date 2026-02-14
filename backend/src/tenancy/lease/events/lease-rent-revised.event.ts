import { Event } from 'nestjs-cqrx';

export interface LeaseRentRevisedData {
  leaseId: string;
  entityId: string;
  previousRentCents: number;
  newRentCents: number;
  previousBaseIndexValue: number | null;
  newBaseIndexValue: number;
  newReferenceQuarter: string;
  newReferenceYear: number;
  revisionId: string;
  approvedAt: string;
}

export class LeaseRentRevised extends Event<LeaseRentRevisedData> {
  constructor(data: LeaseRentRevisedData) {
    super(data);
  }
}
