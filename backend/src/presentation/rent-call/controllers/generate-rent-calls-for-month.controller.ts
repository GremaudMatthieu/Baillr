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
import { PrismaService } from '@infrastructure/database/prisma.service';
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
    private readonly prisma: PrismaService,
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

    // 3. Load active leases with billing line rows joined to charge categories
    const monthStart = new Date(Date.UTC(month.year, month.month - 1, 1));
    const leases = await this.leaseFinder.findAllActiveByEntityAndUser(
      entityId,
      userId,
      monthStart,
    );

    if (leases.length === 0) {
      throw new BadRequestException('Aucun bail actif');
    }

    // 4. Load billing line rows with category labels for all active leases
    const leaseIds = leases.map((l) => l.id);
    const billingLineRows = await this.prisma.leaseBillingLine.findMany({
      where: { leaseId: { in: leaseIds } },
      include: { chargeCategory: true },
    });

    const billingLinesByLease = new Map<
      string,
      Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }>
    >();
    for (const row of billingLineRows) {
      const lines = billingLinesByLease.get(row.leaseId) ?? [];
      lines.push({
        chargeCategoryId: row.chargeCategoryId,
        categoryLabel: row.chargeCategory?.label ?? 'Charge',
        amountCents: row.amountCents,
      });
      billingLinesByLease.set(row.leaseId, lines);
    }

    // 5. Map Prisma → domain format and dispatch
    const activeLeases: ActiveLeaseData[] = leases.map((lease) => ({
      leaseId: lease.id,
      tenantId: lease.tenantId,
      unitId: lease.unitId,
      rentAmountCents: lease.rentAmountCents,
      startDate: lease.startDate.toISOString(),
      endDate: lease.endDate ? lease.endDate.toISOString() : null,
      billingLines: billingLinesByLease.get(lease.id) ?? [],
    }));

    return this.commandBus.execute<GenerateRentCallsForMonthCommand, BatchHandlerResult>(
      new GenerateRentCallsForMonthCommand(entityId, userId, dto.month, activeLeases),
    );
  }
}
