export class TerminateALeaseCommand {
  constructor(
    public readonly leaseId: string,
    public readonly endDate: string,
  ) {}
}
