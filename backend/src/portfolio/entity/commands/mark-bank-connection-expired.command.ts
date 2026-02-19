export class MarkBankConnectionExpiredCommand {
  constructor(
    public readonly entityId: string,
    public readonly connectionId: string,
  ) {}
}
