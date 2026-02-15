export class ConfigureLeaseBillingLinesCommand {
  constructor(
    public readonly leaseId: string,
    public readonly billingLines: { chargeCategoryId: string; amountCents: number }[],
  ) {}
}
