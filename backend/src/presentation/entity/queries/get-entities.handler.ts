import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { OwnershipEntity } from '@prisma/client';
import { GetEntitiesQuery } from './get-entities.query.js';
import { EntityFinder } from '../finders/entity.finder.js';

@QueryHandler(GetEntitiesQuery)
export class GetEntitiesHandler implements IQueryHandler<GetEntitiesQuery> {
  constructor(private readonly finder: EntityFinder) {}

  async execute(query: GetEntitiesQuery): Promise<OwnershipEntity[]> {
    return this.finder.findAllByUserId(query.userId);
  }
}
