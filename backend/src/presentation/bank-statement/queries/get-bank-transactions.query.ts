export class GetBankTransactionsQuery {
  constructor(
    public readonly entityId: string,
    public readonly bankStatementId: string,
    public readonly userId: string,
  ) {}
}
