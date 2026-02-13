import type { UnsentRentCallData } from '../rent-call-data.interfaces.js';

export interface SendResult {
  sent: number;
  failed: number;
  totalAmountCents: number;
  failures: string[];
}

export class SendRentCallsByEmailCommand {
  constructor(
    public readonly entityId: string,
    public readonly month: string,
    public readonly userId: string,
    public readonly unsentRentCalls: UnsentRentCallData[],
  ) {}
}
