export class GetAccountBookQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly startDate?: string,
    public readonly endDate?: string,
    public readonly category?: string,
    public readonly tenantId?: string,
  ) {}
}
