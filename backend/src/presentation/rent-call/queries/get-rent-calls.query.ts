export class GetRentCallsQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
    public readonly month?: string,
  ) {}
}
