export class GetBatchEscalationStatusQuery {
  constructor(
    public readonly entityId: string,
    public readonly rentCallIds: string[],
    public readonly userId: string,
  ) {}
}
