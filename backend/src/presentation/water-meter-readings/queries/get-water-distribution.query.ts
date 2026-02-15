export class GetWaterDistributionQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
  ) {}
}
