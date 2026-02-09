import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { OwnershipEntity } from '@prisma/client';
import { GetEntitiesQuery } from './get-entities.query.js';
import { EntityRepository } from '../repositories/entity.repository.js';

@QueryHandler(GetEntitiesQuery)
export class GetEntitiesHandler implements IQueryHandler<GetEntitiesQuery> {
  constructor(private readonly repository: EntityRepository) {}

  async execute(query: GetEntitiesQuery): Promise<OwnershipEntity[]> {
    return this.repository.findAllByUserId(query.userId);
  }
}
