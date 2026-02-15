import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { Revision } from '@prisma/client';
import { GetRevisionsQuery } from './get-revisions.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RevisionFinder } from '../finders/revision.finder.js';

@QueryHandler(GetRevisionsQuery)
export class GetRevisionsHandler implements IQueryHandler<GetRevisionsQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly revisionFinder: RevisionFinder,
  ) {}

  async execute(query: GetRevisionsQuery): Promise<Revision[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.revisionFinder.findAllByEntity(query.entityId);
  }
}
