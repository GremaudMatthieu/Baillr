import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { Unit } from '@prisma/client';
import { GetAUnitQuery } from './get-a-unit.query.js';
import { UnitFinder } from '../finders/unit.finder.js';

@QueryHandler(GetAUnitQuery)
export class GetAUnitHandler implements IQueryHandler<GetAUnitQuery> {
  constructor(private readonly finder: UnitFinder) {}

  async execute(query: GetAUnitQuery): Promise<Unit> {
    const unit = await this.finder.findByIdAndUser(query.id, query.userId);
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }
}
