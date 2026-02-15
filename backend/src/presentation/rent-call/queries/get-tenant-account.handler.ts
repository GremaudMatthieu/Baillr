import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetTenantAccountQuery } from './get-tenant-account.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AccountEntryFinder } from '../finders/account-entry.finder.js';

@QueryHandler(GetTenantAccountQuery)
export class GetTenantAccountHandler implements IQueryHandler<GetTenantAccountQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly accountEntryFinder: AccountEntryFinder,
  ) {}

  async execute(
    query: GetTenantAccountQuery,
  ): Promise<{ entries: unknown[]; balanceCents: number }> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const entries = await this.accountEntryFinder.findByTenantAndEntity(
      query.tenantId,
      query.entityId,
    );
    const { balanceCents } = await this.accountEntryFinder.getBalance(
      query.tenantId,
      query.entityId,
    );

    return { entries, balanceCents };
  }
}
