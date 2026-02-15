import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { WaterMeterReadings } from '@prisma/client';
import { GetWaterMeterReadingsQuery } from './get-water-meter-readings.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { WaterMeterReadingsFinder } from '../finders/water-meter-readings.finder.js';

@QueryHandler(GetWaterMeterReadingsQuery)
export class GetWaterMeterReadingsHandler implements IQueryHandler<GetWaterMeterReadingsQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly waterMeterReadingsFinder: WaterMeterReadingsFinder,
  ) {}

  async execute(query: GetWaterMeterReadingsQuery): Promise<WaterMeterReadings | null> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.waterMeterReadingsFinder.findByEntityAndYear(query.entityId, query.fiscalYear);
  }
}
