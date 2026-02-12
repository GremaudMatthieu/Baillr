import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { Tenant } from '@prisma/client';
import { GetATenantQuery } from './get-a-tenant.query.js';
import { TenantFinder } from '../finders/tenant.finder.js';

@QueryHandler(GetATenantQuery)
export class GetATenantHandler implements IQueryHandler<GetATenantQuery> {
  constructor(private readonly finder: TenantFinder) {}

  async execute(query: GetATenantQuery): Promise<Tenant> {
    const tenant = await this.finder.findByIdAndUser(query.id, query.userId);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }
}
