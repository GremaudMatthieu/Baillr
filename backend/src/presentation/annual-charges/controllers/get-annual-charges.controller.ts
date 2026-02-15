import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { AnnualCharges } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetAnnualChargesQuery } from '../queries/get-annual-charges.query.js';

@Controller('entities/:entityId/annual-charges')
export class GetAnnualChargesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: AnnualCharges | AnnualCharges[] | null }> {
    let fiscalYear: number | undefined;
    if (fiscalYearStr) {
      const parsed = parseInt(fiscalYearStr, 10);
      if (isNaN(parsed)) {
        return { data: null };
      }
      fiscalYear = parsed;
    }

    const data = await this.queryBus.execute<
      GetAnnualChargesQuery,
      AnnualCharges | AnnualCharges[] | null
    >(new GetAnnualChargesQuery(entityId, userId, fiscalYear));
    return { data };
  }
}
