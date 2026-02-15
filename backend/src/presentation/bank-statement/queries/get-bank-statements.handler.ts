import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { BankStatement } from '@prisma/client';
import { GetBankStatementsQuery } from './get-bank-statements.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankStatementFinder } from '../finders/bank-statement.finder.js';

@QueryHandler(GetBankStatementsQuery)
export class GetBankStatementsHandler implements IQueryHandler<GetBankStatementsQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankStatementFinder: BankStatementFinder,
  ) {}

  async execute(query: GetBankStatementsQuery): Promise<BankStatement[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.bankStatementFinder.findAllByEntity(query.entityId, query.userId);
  }
}
