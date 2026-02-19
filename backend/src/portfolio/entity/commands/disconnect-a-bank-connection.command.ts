export class DisconnectABankConnectionCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly connectionId: string,
  ) {}
}
