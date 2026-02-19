export class LinkABankConnectionCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly connectionId: string,
    public readonly bankAccountId: string,
    public readonly provider: string,
    public readonly institutionId: string,
    public readonly institutionName: string,
    public readonly requisitionId: string,
    public readonly agreementId: string,
    public readonly agreementExpiry: string,
    public readonly accountIds: string[],
  ) {}
}
