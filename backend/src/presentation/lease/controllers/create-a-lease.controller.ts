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
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { CreateALeaseDto } from '../dto/create-a-lease.dto.js';
import { CreateALeaseCommand } from '@tenancy/lease/commands/create-a-lease.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { TenantFinder } from '../../tenant/finders/tenant.finder.js';
import { UnitFinder } from '../../property/finders/unit.finder.js';
import { LeaseFinder } from '../finders/lease.finder.js';

@Controller('entities/:entityId/leases')
export class CreateALeaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly tenantFinder: TenantFinder,
    private readonly unitFinder: UnitFinder,
    private readonly leaseFinder: LeaseFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CreateALeaseDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const [entity, tenant, unit, existingLease] = await Promise.all([
      this.entityFinder.findByIdAndUserId(entityId, userId),
      this.tenantFinder.findByIdAndUser(dto.tenantId, userId),
      this.unitFinder.findByIdAndUser(dto.unitId, userId),
      this.leaseFinder.findByUnitId(dto.unitId, userId),
    ]);

    if (!entity || !tenant || tenant.entityId !== entityId || !unit) {
      throw new UnauthorizedException();
    }
    if (existingLease) {
      throw new ConflictException('Unit already has an active lease');
    }

    await this.commandBus.execute(
      new CreateALeaseCommand(
        dto.id,
        userId,
        entityId,
        dto.tenantId,
        dto.unitId,
        dto.startDate,
        dto.rentAmountCents,
        dto.securityDepositCents,
        dto.monthlyDueDate,
        dto.revisionIndexType,
      ),
    );
  }
}
