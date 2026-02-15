export class GetWaterMeterReadingsQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
  ) {}
}
