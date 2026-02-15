import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { ChargeRegularization } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetChargeRegularizationQuery } from '../queries/get-charge-regularization.query.js';

@Controller('entities/:entityId/charge-regularization')
export class GetChargeRegularizationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: ChargeRegularization | ChargeRegularization[] | null }> {
    let fiscalYear: number | undefined;
    if (fiscalYearStr) {
      const parsed = parseInt(fiscalYearStr, 10);
      if (isNaN(parsed)) {
        return { data: null };
      }
      fiscalYear = parsed;
    }

    const data = await this.queryBus.execute<
      GetChargeRegularizationQuery,
      ChargeRegularization | ChargeRegularization[] | null
    >(new GetChargeRegularizationQuery(entityId, userId, fiscalYear));
    return { data };
  }
}
