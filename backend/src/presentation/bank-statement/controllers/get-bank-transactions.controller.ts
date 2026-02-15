import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { BankTransaction } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetBankTransactionsQuery } from '../queries/get-bank-transactions.query.js';

@Controller('entities/:entityId/bank-statements')
export class GetBankTransactionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':bankStatementId/transactions')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('bankStatementId', ParseUUIDPipe) bankStatementId: string,
    @CurrentUser() userId: string,
  ): Promise<BankTransaction[]> {
    return this.queryBus.execute(new GetBankTransactionsQuery(entityId, bankStatementId, userId));
  }
}
