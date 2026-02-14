import { Event } from 'nestjs-cqrx';

export interface ReminderEmailSentData {
  rentCallId: string;
  tier1SentAt: string;
  recipientEmail: string;
}

export class ReminderEmailSent extends Event<ReminderEmailSentData> {
  constructor(data: ReminderEmailSentData) {
    super(data);
  }
}
