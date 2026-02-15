import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { InseeIndex } from '@prisma/client';
import { GetInseeIndicesQuery } from './get-insee-indices.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { InseeIndexFinder } from '../finders/insee-index.finder.js';

@QueryHandler(GetInseeIndicesQuery)
export class GetInseeIndicesHandler implements IQueryHandler<GetInseeIndicesQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly inseeIndexFinder: InseeIndexFinder,
  ) {}

  async execute(query: GetInseeIndicesQuery): Promise<InseeIndex[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.inseeIndexFinder.findAllByEntity(query.entityId, query.type);
  }
}
