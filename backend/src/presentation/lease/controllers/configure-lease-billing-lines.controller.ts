import {
  Controller,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { ConfigureLeaseBillingLinesDto } from '../dto/configure-lease-billing-lines.dto.js';
import { ConfigureLeaseBillingLinesCommand } from '@tenancy/lease/commands/configure-lease-billing-lines.command';
import { LeaseFinder } from '../finders/lease.finder.js';

@Controller('leases/:id/billing-lines')
export class ConfigureLeaseBillingLinesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly leaseFinder: LeaseFinder,
  ) {}

  @Put()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigureLeaseBillingLinesDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const lease = await this.leaseFinder.findByIdAndUser(id, userId);
    if (!lease) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new ConfigureLeaseBillingLinesCommand(
        id,
        dto.billingLines.map((line) => ({
          label: line.label,
          amountCents: line.amountCents,
          type: line.type,
        })),
      ),
    );
  }
}
