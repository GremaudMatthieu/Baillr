export class GetBankStatementsQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
