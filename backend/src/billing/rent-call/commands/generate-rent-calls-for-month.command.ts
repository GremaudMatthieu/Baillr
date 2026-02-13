import type { ActiveLeaseData } from '../rent-call-calculation.service.js';

export interface BatchHandlerResult {
  generated: number;
  totalAmountCents: number;
  exceptions: string[];
}

export class GenerateRentCallsForMonthCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly month: string,
    public readonly activeLeases: ActiveLeaseData[],
  ) {}
}
