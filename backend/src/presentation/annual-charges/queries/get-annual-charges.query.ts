export class GetAnnualChargesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear?: number,
  ) {}
}
