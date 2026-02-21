export class UpdateRegisteredMailStatusCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly status: string,
    public readonly proofUrl: string | null,
  ) {}
}
