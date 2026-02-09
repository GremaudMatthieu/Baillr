import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { OwnershipEntity } from '@prisma/client';
import { GetAnEntityQuery } from './get-an-entity.query.js';
import { EntityRepository } from '../repositories/entity.repository.js';

@QueryHandler(GetAnEntityQuery)
export class GetAnEntityHandler implements IQueryHandler<GetAnEntityQuery> {
  constructor(private readonly repository: EntityRepository) {}

  async execute(query: GetAnEntityQuery): Promise<OwnershipEntity> {
    const entity = await this.repository.findByIdAndUserId(query.id, query.userId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }
    return entity;
  }
}
