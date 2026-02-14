import { Event } from 'nestjs-cqrx';

export interface RevisionApprovedData {
  revisionId: string;
  leaseId: string;
  entityId: string;
  userId: string;
  newRentCents: number;
  previousRentCents: number;
  newIndexValue: number;
  newIndexQuarter: string;
  newIndexYear: number;
  approvedAt: string;
}

export class RevisionApproved extends Event<RevisionApprovedData> {
  constructor(data: RevisionApprovedData) {
    super(data);
  }
}
