export class ApproveRevisionsCommand {
  constructor(
    public readonly revisionIds: string[],
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
