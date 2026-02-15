export class GetProvisionsCollectedQuery {
  constructor(
    public readonly entityId: string,
    public readonly fiscalYear: number,
    public readonly userId: string,
  ) {}
}
