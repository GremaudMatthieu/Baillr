export class DispatchViaRegisteredMailCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly entityId: string,
    public readonly tenantId: string,
    public readonly trackingId: string,
    public readonly provider: string,
    public readonly costCents: number,
  ) {}
}
