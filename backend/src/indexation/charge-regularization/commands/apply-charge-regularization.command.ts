export class ApplyChargeRegularizationCommand {
  constructor(
    public readonly id: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
  ) {}
}
