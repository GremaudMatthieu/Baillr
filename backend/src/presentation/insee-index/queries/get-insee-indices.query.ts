export class GetInseeIndicesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly type?: string,
  ) {}
}
