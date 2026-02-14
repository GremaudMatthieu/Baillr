import { Event } from 'nestjs-cqrx';

export interface StakeholderNotificationGeneratedData {
  rentCallId: string;
  tier3SentAt: string;
}

export class StakeholderNotificationGenerated extends Event<StakeholderNotificationGeneratedData> {
  constructor(data: StakeholderNotificationGeneratedData) {
    super(data);
  }
}
