export class GetUnitsByEntityQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
