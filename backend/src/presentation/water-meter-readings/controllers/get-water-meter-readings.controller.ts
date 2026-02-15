import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { WaterMeterReadings } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetWaterMeterReadingsQuery } from '../queries/get-water-meter-readings.query.js';

@Controller('entities/:entityId/water-meter-readings')
export class GetWaterMeterReadingsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: WaterMeterReadings | null }> {
    if (!fiscalYearStr) {
      return { data: null };
    }

    const fiscalYear = parseInt(fiscalYearStr, 10);
    if (isNaN(fiscalYear)) {
      return { data: null };
    }

    const data = await this.queryBus.execute<GetWaterMeterReadingsQuery, WaterMeterReadings | null>(
      new GetWaterMeterReadingsQuery(entityId, userId, fiscalYear),
    );
    return { data };
  }
}
