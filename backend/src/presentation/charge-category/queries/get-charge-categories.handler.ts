import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { ChargeCategory } from '@prisma/client';
import { GetChargeCategoriesQuery } from './get-charge-categories.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ChargeCategoryFinder } from '../finders/charge-category.finder.js';
import { ChargeCategorySeeder } from '../charge-category-seeder.js';

@QueryHandler(GetChargeCategoriesQuery)
export class GetChargeCategoriesHandler implements IQueryHandler<GetChargeCategoriesQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly finder: ChargeCategoryFinder,
    private readonly seeder: ChargeCategorySeeder,
  ) {}

  async execute(query: GetChargeCategoriesQuery): Promise<ChargeCategory[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.seeder.ensureStandardCategories(query.entityId);

    return this.finder.findByEntityId(query.entityId);
  }
}
