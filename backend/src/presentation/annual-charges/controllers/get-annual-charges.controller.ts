import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import type { AnnualCharges } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AnnualChargesFinder } from '../finders/annual-charges.finder.js';

@Controller('entities/:entityId/annual-charges')
export class GetAnnualChargesController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly annualChargesFinder: AnnualChargesFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: AnnualCharges | AnnualCharges[] | null }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    if (fiscalYearStr) {
      const fiscalYear = parseInt(fiscalYearStr, 10);
      if (isNaN(fiscalYear)) {
        return { data: null };
      }
      const data = await this.annualChargesFinder.findByEntityAndYear(
        entityId,
        fiscalYear,
      );
      return { data };
    }

    const data = await this.annualChargesFinder.findAllByEntity(entityId);
    return { data };
  }
}
