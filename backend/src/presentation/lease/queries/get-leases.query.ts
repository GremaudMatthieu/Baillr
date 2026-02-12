export class GetLeasesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
