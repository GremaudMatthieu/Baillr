import { Event } from 'nestjs-cqrx';

export interface LeaseRevisionParametersConfiguredData {
  leaseId: string;
  revisionDay: number;
  revisionMonth: number;
  referenceQuarter: string;
  referenceYear: number;
  baseIndexValue: number | null;
}

export class LeaseRevisionParametersConfigured extends Event<LeaseRevisionParametersConfiguredData> {
  constructor(data: LeaseRevisionParametersConfiguredData) {
    super(data);
  }
}
