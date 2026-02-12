import { Event } from 'nestjs-cqrx';

export interface LeaseTerminatedData {
  leaseId: string;
  endDate: string;
}

export class LeaseTerminated extends Event<LeaseTerminatedData> {
  constructor(data: LeaseTerminatedData) {
    super(data);
  }
}
