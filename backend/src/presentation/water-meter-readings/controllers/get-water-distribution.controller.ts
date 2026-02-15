import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetWaterDistributionQuery } from '../queries/get-water-distribution.query.js';
import type { WaterDistributionResult } from '../services/water-distribution.service.js';

@Controller('entities/:entityId/water-distribution')
export class GetWaterDistributionController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: WaterDistributionResult | null }> {
    if (!fiscalYearStr) {
      return { data: null };
    }

    const fiscalYear = parseInt(fiscalYearStr, 10);
    if (isNaN(fiscalYear)) {
      return { data: null };
    }

    const data = await this.queryBus.execute<GetWaterDistributionQuery, WaterDistributionResult | null>(
      new GetWaterDistributionQuery(entityId, userId, fiscalYear),
    );
    return { data };
  }
}
