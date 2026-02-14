import { Event } from 'nestjs-cqrx';

export interface IndexRecordedData {
  indexId: string;
  type: string;
  quarter: string;
  year: number;
  value: number;
  entityId: string;
  userId: string;
  recordedAt: string;
}

export class IndexRecorded extends Event<IndexRecordedData> {
  constructor(data: IndexRecordedData) {
    super(data);
  }
}
