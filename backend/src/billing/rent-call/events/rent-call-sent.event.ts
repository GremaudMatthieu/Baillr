import { Event } from 'nestjs-cqrx';

export interface RentCallSentData {
  rentCallId: string;
  sentAt: string;
  recipientEmail: string;
  entityId: string;
  tenantId: string;
}

export class RentCallSent extends Event<RentCallSentData> {
  constructor(data: RentCallSentData) {
    super(data);
  }
}
