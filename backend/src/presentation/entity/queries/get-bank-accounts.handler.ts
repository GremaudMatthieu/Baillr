import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { BankAccount } from '@prisma/client';
import { GetBankAccountsQuery } from './get-bank-accounts.query.js';
import { EntityFinder } from '../finders/entity.finder.js';
import { PrismaService } from '@infrastructure/database/prisma.service';

@QueryHandler(GetBankAccountsQuery)
export class GetBankAccountsHandler implements IQueryHandler<GetBankAccountsQuery> {
  constructor(
    private readonly finder: EntityFinder,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: GetBankAccountsQuery): Promise<BankAccount[]> {
    const entity = await this.finder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.prisma.bankAccount.findMany({
      where: { entityId: query.entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
