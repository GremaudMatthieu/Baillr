import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GenerateRentCallsForMonthDto } from '../dto/generate-rent-calls-for-month.dto.js';
import {
  GenerateRentCallsForMonthCommand,
  type BatchHandlerResult,
} from '@billing/rent-call/commands/generate-rent-calls-for-month.command';
import { RentCallMonth } from '@billing/rent-call/rent-call-month';
import type { ActiveLeaseData } from '@billing/rent-call/rent-call-calculation.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { LeaseFinder } from '../../lease/finders/lease.finder.js';
import { RentCallFinder } from '../finders/rent-call.finder.js';

@Controller('entities/:entityId/rent-calls')
export class GenerateRentCallsForMonthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly leaseFinder: LeaseFinder,
    private readonly rentCallFinder: RentCallFinder,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: GenerateRentCallsForMonthDto,
    @CurrentUser() userId: string,
  ): Promise<BatchHandlerResult> {
    // 1. Validate month format
    let month: RentCallMonth;
    try {
      month = RentCallMonth.fromString(dto.month);
    } catch {
      throw new BadRequestException('Invalid month format');
    }

    // 2. Entity ownership + idempotency check (parallel)
    const [entity, alreadyGenerated] = await Promise.all([
      this.entityFinder.findByIdAndUserId(entityId, userId),
      this.rentCallFinder.existsByEntityAndMonth(entityId, dto.month, userId),
    ]);

    if (!entity) {
      throw new UnauthorizedException();
    }
    if (alreadyGenerated) {
      throw new ConflictException('Appels de loyer déjà générés pour ce mois');
    }

    // 3. Load active leases
    const monthStart = new Date(Date.UTC(month.year, month.month - 1, 1));
    const leases = await this.leaseFinder.findAllActiveByEntityAndUser(
      entityId,
      userId,
      monthStart,
    );

    if (leases.length === 0) {
      throw new BadRequestException('Aucun bail actif');
    }

    // 4. Map Prisma → domain format and dispatch
    const activeLeases: ActiveLeaseData[] = leases.map((lease) => ({
      leaseId: lease.id,
      tenantId: lease.tenantId,
      unitId: lease.unitId,
      rentAmountCents: lease.rentAmountCents,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate ? lease.endDate.toISOString() : null,
      billingLines: Array.isArray(lease.billingLines)
        ? (lease.billingLines as Array<{ label: string; amountCents: number; type: string }>)
        : [],
    }));

    return this.commandBus.execute<GenerateRentCallsForMonthCommand, BatchHandlerResult>(
      new GenerateRentCallsForMonthCommand(entityId, userId, dto.month, activeLeases),
    );
  }
}
