export class ConfigureLeaseRevisionParametersCommand {
  constructor(
    public readonly leaseId: string,
    public readonly revisionDay: number,
    public readonly revisionMonth: number,
    public readonly referenceQuarter: string,
    public readonly referenceYear: number,
    public readonly baseIndexValue: number | null,
  ) {}
}
