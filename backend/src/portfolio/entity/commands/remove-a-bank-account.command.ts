export class RemoveABankAccountCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly accountId: string,
  ) {}
}
