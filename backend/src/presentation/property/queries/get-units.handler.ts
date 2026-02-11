import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Unit } from '@prisma/client';
import { GetUnitsQuery } from './get-units.query.js';
import { UnitFinder } from '../finders/unit.finder.js';

@QueryHandler(GetUnitsQuery)
export class GetUnitsHandler implements IQueryHandler<GetUnitsQuery> {
  constructor(private readonly finder: UnitFinder) {}

  async execute(query: GetUnitsQuery): Promise<Unit[]> {
    return this.finder.findAllByPropertyAndUser(query.propertyId, query.userId);
  }
}
