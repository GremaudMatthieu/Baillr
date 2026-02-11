export class GetUnitsQuery {
  constructor(
    public readonly propertyId: string,
    public readonly userId: string,
  ) {}
}
