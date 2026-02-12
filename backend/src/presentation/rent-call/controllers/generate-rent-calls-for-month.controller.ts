import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GenerateRentCallsForMonthDto } from '../dto/generate-rent-calls-for-month.dto.js';
import { GenerateRentCallsForMonthCommand } from '@billing/rent-call/commands/generate-rent-calls-for-month.command';
import { RentCallCalculationService } from '@billing/rent-call/rent-call-calculation.service';
import { RentCallMonth } from '@billing/rent-call/rent-call-month';
import type { BatchHandlerResult } from '@billing/rent-call/commands/generate-rent-calls-for-month.command';
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
    private readonly calculationService: RentCallCalculationService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: GenerateRentCallsForMonthDto,
    @CurrentUser() userId: string,
  ): Promise<BatchHandlerResult> {
    // 1. Verify entity ownership
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    // 2. Validate month format
    let month: RentCallMonth;
    try {
      month = RentCallMonth.fromString(dto.month);
    } catch {
      throw new BadRequestException('Invalid month format');
    }

    // 3. Check for existing rent calls
    const alreadyGenerated = await this.rentCallFinder.existsByEntityAndMonth(
      entityId,
      dto.month,
      userId,
    );
    if (alreadyGenerated) {
      throw new ConflictException('Appels de loyer déjà générés pour ce mois');
    }

    // 4. Load active leases (filtered by month boundary, not NOW)
    const monthStart = new Date(Date.UTC(month.year, month.month - 1, 1));
    const leases = await this.leaseFinder.findAllActiveByEntityAndUser(
      entityId,
      userId,
      monthStart,
    );

    if (leases.length === 0) {
      throw new BadRequestException('Aucun bail actif');
    }

    // 5. Validate and map lease data
    const activeLeaseData = leases.map((lease) => {
      const rawLines = lease.billingLines;
      const billingLines = Array.isArray(rawLines)
        ? (rawLines as Array<{ label: string; amountCents: number; type: string }>)
        : [];
      return {
        leaseId: lease.id,
        tenantId: lease.tenantId,
        unitId: lease.unitId,
        rentAmountCents: lease.rentAmountCents,
        startDate: lease.startDate.toISOString(),
        endDate: lease.endDate ? lease.endDate.toISOString() : null,
        billingLines,
      };
    });

    // 6. Calculate amounts via domain service
    const calculations = this.calculationService.calculateForMonth(
      activeLeaseData,
      month,
    );

    if (calculations.length === 0) {
      throw new BadRequestException('Aucun bail actif pour ce mois');
    }

    // 7. Generate UUIDs and dispatch single command
    const rentCallData = calculations.map((calc) => ({
      id: randomUUID(),
      ...calc,
    }));

    return this.commandBus.execute<GenerateRentCallsForMonthCommand, BatchHandlerResult>(
      new GenerateRentCallsForMonthCommand(entityId, userId, dto.month, rentCallData),
    );
  }
}
