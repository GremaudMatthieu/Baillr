import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Tenant } from '@prisma/client';
import { GetTenantsQuery } from './get-tenants.query.js';
import { TenantFinder } from '../finders/tenant.finder.js';

@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(private readonly finder: TenantFinder) {}

  async execute(query: GetTenantsQuery): Promise<Tenant[]> {
    return this.finder.findAllByEntityAndUser(query.entityId, query.userId);
  }
}
