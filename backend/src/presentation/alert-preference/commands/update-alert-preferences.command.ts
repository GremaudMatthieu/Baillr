export class UpdateAlertPreferencesCommand {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly preferences: { alertType: string; enabled: boolean }[],
  ) {}
}
