import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetWaterDistributionQuery } from './get-water-distribution.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { WaterMeterReadingsFinder } from '../finders/water-meter-readings.finder.js';
import { AnnualChargesFinder } from '../../annual-charges/finders/annual-charges.finder.js';
import { WaterDistributionService, type WaterDistributionResult } from '../services/water-distribution.service.js';
import type { MeterReadingPrimitives } from '@indexation/water-meter-readings/meter-reading';

@QueryHandler(GetWaterDistributionQuery)
export class GetWaterDistributionHandler implements IQueryHandler<GetWaterDistributionQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly waterMeterReadingsFinder: WaterMeterReadingsFinder,
    private readonly annualChargesFinder: AnnualChargesFinder,
    private readonly waterDistributionService: WaterDistributionService,
  ) {}

  async execute(query: GetWaterDistributionQuery): Promise<WaterDistributionResult | null> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const annualCharges = await this.annualChargesFinder.findByEntityAndYear(query.entityId, query.fiscalYear);
    if (!annualCharges) {
      return null;
    }

    // Find the water charge category amount
    const charges = annualCharges.charges as Array<{ chargeCategoryId: string | null; label: string; amountCents: number }>;
    const waterCharge = charges.find(
      (c) => c.label.toLowerCase().includes('eau') || (c.chargeCategoryId?.includes('water') ?? false),
    );

    if (!waterCharge) {
      return null;
    }

    const waterReadings = await this.waterMeterReadingsFinder.findByEntityAndYear(query.entityId, query.fiscalYear);

    // Get all unit IDs from readings (metered units) — we only distribute among metered units
    const readings = (waterReadings?.readings ?? []) as unknown as MeterReadingPrimitives[];
    const allUnitIds = readings.map((r) => r.unitId);

    // If no readings exist, return null
    if (allUnitIds.length === 0) {
      return null;
    }

    return this.waterDistributionService.compute(waterReadings, waterCharge.amountCents, allUnitIds);
  }
}
