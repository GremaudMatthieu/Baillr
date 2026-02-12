export class ConfigureLeaseBillingLinesCommand {
  constructor(
    public readonly leaseId: string,
    public readonly billingLines: { label: string; amountCents: number; type: string }[],
  ) {}
}
