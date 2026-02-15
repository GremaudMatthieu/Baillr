export class GetChargeCategoriesQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}
