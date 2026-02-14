export class GenerateAFormalNoticeCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly entityId: string,
    public readonly tenantId: string,
  ) {}
}
