export class SendAReminderEmailCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly entityId: string,
    public readonly tenantId: string,
    public readonly tenantEmail: string,
  ) {}
}
