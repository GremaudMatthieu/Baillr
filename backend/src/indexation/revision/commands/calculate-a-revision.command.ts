export class CalculateARevisionCommand {
  constructor(
    public readonly id: string,
    public readonly leaseId: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly unitId: string,
    public readonly tenantName: string,
    public readonly unitLabel: string,
    public readonly currentRentCents: number,
    public readonly baseIndexValue: number,
    public readonly baseIndexQuarter: string,
    public readonly baseIndexYear: number,
    public readonly newIndexValue: number,
    public readonly newIndexQuarter: string,
    public readonly newIndexYear: number,
    public readonly revisionIndexType: string,
  ) {}
}
