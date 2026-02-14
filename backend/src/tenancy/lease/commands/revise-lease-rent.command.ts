export class ReviseLeaseRentCommand {
  constructor(
    public readonly leaseId: string,
    public readonly newRentCents: number,
    public readonly newBaseIndexValue: number,
    public readonly newReferenceQuarter: string,
    public readonly newReferenceYear: number,
    public readonly revisionId: string,
  ) {}
}
