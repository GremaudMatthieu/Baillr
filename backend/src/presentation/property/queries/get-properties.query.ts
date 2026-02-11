export class GetPropertiesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
