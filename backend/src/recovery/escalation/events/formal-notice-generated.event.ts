import { Event } from 'nestjs-cqrx';

export interface FormalNoticeGeneratedData {
  rentCallId: string;
  tier2SentAt: string;
}

export class FormalNoticeGenerated extends Event<FormalNoticeGeneratedData> {
  constructor(data: FormalNoticeGeneratedData) {
    super(data);
  }
}
