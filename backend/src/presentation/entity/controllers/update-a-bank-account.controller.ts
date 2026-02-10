import { Controller, Put, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { UpdateABankAccountDto } from '../dto/update-a-bank-account.dto.js';
import { UpdateABankAccountCommand } from '@portfolio/entity/commands/update-a-bank-account.command';

@Controller('entities/:entityId/bank-accounts')
export class UpdateABankAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':accountId')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: UpdateABankAccountDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateABankAccountCommand(
        entityId,
        userId,
        accountId,
        dto.label,
        dto.iban,
        dto.bic,
        dto.bankName,
        dto.isDefault,
      ),
    );
  }
}
