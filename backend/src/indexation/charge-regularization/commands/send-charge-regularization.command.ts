export interface SendResult {
  sent: number;
  failed: number;
  failures: string[];
}

export class SendChargeRegularizationCommand {
  constructor(
    public readonly chargeRegularizationId: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
  ) {}
}
