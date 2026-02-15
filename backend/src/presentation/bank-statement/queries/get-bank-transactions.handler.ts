import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { BankTransaction } from '@prisma/client';
import { GetBankTransactionsQuery } from './get-bank-transactions.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankStatementFinder } from '../finders/bank-statement.finder.js';

@QueryHandler(GetBankTransactionsQuery)
export class GetBankTransactionsHandler implements IQueryHandler<GetBankTransactionsQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankStatementFinder: BankStatementFinder,
  ) {}

  async execute(query: GetBankTransactionsQuery): Promise<BankTransaction[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.bankStatementFinder.findTransactions(
      query.bankStatementId,
      query.entityId,
      query.userId,
    );
  }
}
