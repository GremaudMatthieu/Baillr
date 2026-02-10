import { Controller, Post, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { AddABankAccountDto } from '../dto/add-a-bank-account.dto.js';
import { AddABankAccountCommand } from '@portfolio/entity/commands/add-a-bank-account.command';

@Controller('entities/:entityId/bank-accounts')
export class AddABankAccountController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: AddABankAccountDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new AddABankAccountCommand(
        entityId,
        userId,
        dto.accountId,
        dto.type,
        dto.label,
        dto.iban ?? null,
        dto.bic ?? null,
        dto.bankName ?? null,
        dto.isDefault,
      ),
    );
  }
}
