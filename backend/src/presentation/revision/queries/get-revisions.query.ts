export class GetRevisionsQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
