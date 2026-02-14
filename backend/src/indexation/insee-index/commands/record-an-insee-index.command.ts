export class RecordAnInseeIndexCommand {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly quarter: string,
    public readonly year: number,
    public readonly value: number,
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
