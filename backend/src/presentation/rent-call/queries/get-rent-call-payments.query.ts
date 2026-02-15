export class GetRentCallPaymentsQuery {
  constructor(
    public readonly entityId: string,
    public readonly rentCallId: string,
    public readonly userId: string,
  ) {}
}
