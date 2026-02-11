import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Unit } from '@prisma/client';
import { GetUnitsByEntityQuery } from './get-units-by-entity.query.js';
import { UnitFinder } from '../finders/unit.finder.js';

export interface UnitWithPropertyName extends Unit {
  propertyName: string;
}

@QueryHandler(GetUnitsByEntityQuery)
export class GetUnitsByEntityHandler implements IQueryHandler<GetUnitsByEntityQuery> {
  constructor(private readonly finder: UnitFinder) {}

  async execute(query: GetUnitsByEntityQuery): Promise<UnitWithPropertyName[]> {
    const units = await this.finder.findAllByEntityAndUser(query.entityId, query.userId);

    return units.map((unit) => {
      const { property, ...rest } = unit;
      return { ...rest, propertyName: property.name };
    });
  }
}
