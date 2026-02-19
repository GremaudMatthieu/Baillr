export class GetAlertPreferencesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
