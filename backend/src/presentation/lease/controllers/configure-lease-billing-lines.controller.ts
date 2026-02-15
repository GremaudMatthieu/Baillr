import {
  Controller,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { ConfigureLeaseBillingLinesDto } from '../dto/configure-lease-billing-lines.dto.js';
import { ConfigureLeaseBillingLinesCommand } from '@tenancy/lease/commands/configure-lease-billing-lines.command';
import { LeaseFinder } from '../finders/lease.finder.js';
import { ChargeCategoryFinder } from '../../charge-category/finders/charge-category.finder.js';

@Controller('leases/:id/billing-lines')
export class ConfigureLeaseBillingLinesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly leaseFinder: LeaseFinder,
    private readonly chargeCategoryFinder: ChargeCategoryFinder,
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

    // Validate all chargeCategoryIds belong to the lease's entity
    if (dto.billingLines.length > 0) {
      const categoryIds = dto.billingLines.map((l) => l.chargeCategoryId);
      const found = await this.chargeCategoryFinder.findByIdsAndEntity(categoryIds, lease.entityId);
      if (found.length !== categoryIds.length) {
        throw new BadRequestException('Une ou plusieurs catégories de charges sont invalides');
      }
    }

    await this.commandBus.execute(
      new ConfigureLeaseBillingLinesCommand(
        id,
        dto.billingLines.map((line) => ({
          chargeCategoryId: line.chargeCategoryId,
          amountCents: line.amountCents,
        })),
      ),
    );
  }
}
