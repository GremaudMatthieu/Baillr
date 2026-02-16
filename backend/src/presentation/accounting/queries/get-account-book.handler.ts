import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AccountingFinder } from '../finders/accounting.finder.js';
import { GetAccountBookQuery } from './get-account-book.query.js';
import type { AccountEntryWithTenant } from '../finders/accounting.finder.js';

export interface AccountBookResult {
  entries: AccountEntryWithTenant[];
  totalBalanceCents: number;
  availableCategories: string[];
}

@QueryHandler(GetAccountBookQuery)
export class GetAccountBookHandler
  implements IQueryHandler<GetAccountBookQuery>
{
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly accountingFinder: AccountingFinder,
  ) {}

  async execute(query: GetAccountBookQuery): Promise<AccountBookResult> {
    const entity = await this.entityFinder.findByIdAndUserId(
      query.entityId,
      query.userId,
    );
    if (!entity) {
      throw new UnauthorizedException();
    }

    const [entries, totalBalanceCents, availableCategories] = await Promise.all([
      this.accountingFinder.findByEntity(query.entityId, {
        startDate: query.startDate,
        endDate: query.endDate,
        category: query.category,
        tenantId: query.tenantId,
      }),
      this.accountingFinder.getTotalBalance(query.entityId, query.tenantId),
      this.accountingFinder.getAvailableCategories(query.entityId),
    ]);

    return { entries, totalBalanceCents, availableCategories };
  }
}
