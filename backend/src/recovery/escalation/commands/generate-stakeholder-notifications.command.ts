export class GenerateStakeholderNotificationsCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly entityId: string,
    public readonly tenantId: string,
  ) {}
}
