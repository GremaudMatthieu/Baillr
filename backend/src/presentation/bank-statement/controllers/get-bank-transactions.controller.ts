import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankStatementFinder } from '../finders/bank-statement.finder.js';

@Controller('entities/:entityId/bank-statements')
export class GetBankTransactionsController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankStatementFinder: BankStatementFinder,
  ) {}

  @Get(':bankStatementId/transactions')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('bankStatementId', ParseUUIDPipe) bankStatementId: string,
    @CurrentUser() userId: string,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.bankStatementFinder.findTransactions(
      bankStatementId,
      entityId,
      userId,
    );
  }
}
