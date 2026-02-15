import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { BankStatement } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetBankStatementsQuery } from '../queries/get-bank-statements.query.js';

@Controller('entities/:entityId/bank-statements')
export class GetBankStatementsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<BankStatement[]> {
    return this.queryBus.execute(new GetBankStatementsQuery(entityId, userId));
  }
}
