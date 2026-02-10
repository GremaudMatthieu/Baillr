import { Controller, Delete, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { RemoveABankAccountCommand } from '@portfolio/entity/commands/remove-a-bank-account.command';

@Controller('entities/:entityId/bank-accounts')
export class RemoveABankAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Delete(':accountId')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(new RemoveABankAccountCommand(entityId, userId, accountId));
  }
}
