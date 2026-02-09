import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { OwnershipEntity } from '@prisma/client';
import { GetAnEntityQuery } from './get-an-entity.query.js';
import { EntityFinder } from '../finders/entity.finder.js';

@QueryHandler(GetAnEntityQuery)
export class GetAnEntityHandler implements IQueryHandler<GetAnEntityQuery> {
  constructor(private readonly finder: EntityFinder) {}

  async execute(query: GetAnEntityQuery): Promise<OwnershipEntity> {
    const entity = await this.finder.findByIdAndUserId(query.id, query.userId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }
}
