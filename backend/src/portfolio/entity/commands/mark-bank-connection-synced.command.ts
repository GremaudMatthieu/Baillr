export class MarkBankConnectionSyncedCommand {
  constructor(
    public readonly entityId: string,
    public readonly connectionId: string,
    public readonly lastSyncedAt: string,
  ) {}
}
