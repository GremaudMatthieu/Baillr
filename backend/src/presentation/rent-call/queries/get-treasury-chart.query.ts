export class GetTreasuryChartQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly months: number,
  ) {}
}
