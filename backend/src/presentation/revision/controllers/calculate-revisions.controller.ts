import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { LeaseFinder } from '../../lease/finders/lease.finder.js';
import { InseeIndexFinder } from '../../insee-index/finders/insee-index.finder.js';
import { RevisionFinder } from '../finders/revision.finder.js';
import { CalculateARevisionCommand } from '@indexation/revision/commands/calculate-a-revision.command';

export interface BatchCalculationResult {
  calculated: number;
  skipped: string[];
  errors: string[];
}

function formatTenantName(tenant: {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  type: string;
}): string {
  if (tenant.type === 'company' && tenant.companyName) {
    return tenant.companyName;
  }
  return `${tenant.lastName} ${tenant.firstName}`;
}

@Controller('entities/:entityId/revisions')
export class CalculateRevisionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly leaseFinder: LeaseFinder,
    private readonly inseeIndexFinder: InseeIndexFinder,
    private readonly revisionFinder: RevisionFinder,
  ) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<BatchCalculationResult> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const leases =
      await this.leaseFinder.findAllActiveWithRevisionParams(entityId, userId);

    const result: BatchCalculationResult = {
      calculated: 0,
      skipped: [],
      errors: [],
    };

    for (const lease of leases) {
      try {
        // Skip if already revised for this period
        const alreadyRevised = await this.revisionFinder.existsByLeaseAndPeriod(
          lease.id,
          lease.referenceYear!,
          lease.referenceQuarter!,
        );
        if (alreadyRevised) {
          result.skipped.push(lease.id);
          continue;
        }

        // Look up matching INSEE index
        const newIndex = await this.inseeIndexFinder.findByTypeQuarterYear(
          lease.revisionIndexType,
          lease.referenceQuarter!,
          lease.referenceYear!,
          entityId,
        );
        if (!newIndex) {
          result.skipped.push(lease.id);
          continue;
        }

        const revisionId = randomUUID();
        const tenantName = formatTenantName(lease.tenant);
        const unitLabel = lease.unit.identifier;

        await this.commandBus.execute(
          new CalculateARevisionCommand(
            revisionId,
            lease.id,
            entityId,
            userId,
            lease.tenantId,
            lease.unitId,
            tenantName,
            unitLabel,
            lease.rentAmountCents,
            lease.baseIndexValue!,
            lease.referenceQuarter!,
            newIndex.value,
            newIndex.quarter,
            newIndex.year,
            lease.revisionIndexType,
          ),
        );
        result.calculated++;
      } catch (error) {
        result.errors.push(
          `${lease.id}: ${(error as Error).message}`,
        );
      }
    }

    return result;
  }
}
