import { Event } from 'nestjs-cqrx';

export interface RegisteredMailDispatchedData {
  rentCallId: string;
  trackingId: string;
  provider: string;
  costCents: number;
  dispatchedAt: string;
}

export class RegisteredMailDispatched extends Event<RegisteredMailDispatchedData> {
  constructor(data: RegisteredMailDispatchedData) {
    super(data);
  }
}
