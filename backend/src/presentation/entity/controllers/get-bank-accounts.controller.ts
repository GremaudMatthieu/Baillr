import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { BankAccount } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetBankAccountsQuery } from '../queries/get-bank-accounts.query.js';

@Controller('entities/:entityId/bank-accounts')
export class GetBankAccountsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: BankAccount[] }> {
    const accounts: BankAccount[] = await this.queryBus.execute(
      new GetBankAccountsQuery(entityId, userId),
    );
    return { data: accounts };
  }
}
