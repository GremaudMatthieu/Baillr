export class CreateALeaseCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly entityId: string,
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly startDate: string,
    public readonly rentAmountCents: number,
    public readonly securityDepositCents: number,
    public readonly monthlyDueDate: number,
    public readonly revisionIndexType: string,
  ) {}
}
