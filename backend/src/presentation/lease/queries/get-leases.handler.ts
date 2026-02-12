import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Lease } from '@prisma/client';
import { GetLeasesQuery } from './get-leases.query.js';
import { LeaseFinder } from '../finders/lease.finder.js';

@QueryHandler(GetLeasesQuery)
export class GetLeasesHandler implements IQueryHandler<GetLeasesQuery> {
  constructor(private readonly finder: LeaseFinder) {}

  async execute(query: GetLeasesQuery): Promise<Lease[]> {
    return this.finder.findAllByEntityAndUser(query.entityId, query.userId);
  }
}
