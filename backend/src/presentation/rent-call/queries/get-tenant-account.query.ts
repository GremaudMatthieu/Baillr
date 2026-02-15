export class GetTenantAccountQuery {
  constructor(
    public readonly entityId: string,
    public readonly tenantId: string,
    public readonly userId: string,
  ) {}
}
