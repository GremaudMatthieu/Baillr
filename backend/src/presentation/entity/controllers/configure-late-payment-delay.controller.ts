import { Controller, Put, Param, Body, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { ConfigureLatePaymentDelayDto } from '../dto/configure-late-payment-delay.dto.js';
import { ConfigureLatePaymentDelayCommand } from '@portfolio/entity/commands/configure-late-payment-delay.command';

@Controller('entities')
export class ConfigureLatePaymentDelayController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':entityId/late-payment-delay')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: ConfigureLatePaymentDelayDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ConfigureLatePaymentDelayCommand(entityId, userId, dto.days),
    );
  }
}
