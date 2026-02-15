import { Injectable } from '@nestjs/common';
import type { WaterMeterReadings } from '@prisma/client';
import type { MeterReadingPrimitives } from '@indexation/water-meter-readings/meter-reading';

export interface UnitWaterDistribution {
  unitId: string;
  consumption: number | null;
  percentage: number | null;
  amountCents: number;
  isMetered: boolean;
}

export interface WaterDistributionResult {
  fiscalYear: number;
  totalWaterCents: number;
  totalConsumption: number;
  distributions: UnitWaterDistribution[];
}

@Injectable()
export class WaterDistributionService {
  compute(
    waterReadings: WaterMeterReadings | null,
    waterTotalCents: number,
    allUnitIds: string[],
  ): WaterDistributionResult {
    const readings = (waterReadings?.readings ?? []) as unknown as MeterReadingPrimitives[];
    const totalConsumption = waterReadings?.totalConsumption ?? 0;
    const fiscalYear = waterReadings?.fiscalYear ?? 0;

    // Edge case: no water charges
    if (waterTotalCents <= 0 || allUnitIds.length === 0) {
      return {
        fiscalYear,
        totalWaterCents: waterTotalCents,
        totalConsumption: 0,
        distributions: allUnitIds.map((unitId) => ({
          unitId,
          consumption: null,
          percentage: null,
          amountCents: 0,
          isMetered: false,
        })),
      };
    }

    const meteredUnitIds = new Set(readings.map((r) => r.unitId));

    // Edge case: no readings or zero total consumption → equal split among all units
    if (readings.length === 0 || totalConsumption === 0) {
      const perUnit = Math.floor(waterTotalCents / allUnitIds.length);
      const remainder = waterTotalCents - perUnit * allUnitIds.length;
      return {
        fiscalYear,
        totalWaterCents: waterTotalCents,
        totalConsumption: 0,
        distributions: allUnitIds.map((unitId, i) => ({
          unitId,
          consumption: null,
          percentage: null,
          amountCents: perUnit + (i === 0 ? remainder : 0),
          isMetered: false,
        })),
      };
    }

    // Distribute ALL water charges proportionally among metered units
    // Unmetered units get 0 (incentivizes installing meters)
    const distributions: UnitWaterDistribution[] = [];
    let sumMetered = 0;

    // First pass: compute metered shares
    const meteredDistributions: { unitId: string; consumption: number; amountCents: number }[] = [];
    for (const reading of readings) {
      const consumption = reading.currentReading - reading.previousReading;
      const amountCents = Math.floor((consumption / totalConsumption) * waterTotalCents);
      sumMetered += amountCents;
      meteredDistributions.push({ unitId: reading.unitId, consumption, amountCents });
    }

    // Distribute rounding remainder to first metered unit
    const meteredRemainder = waterTotalCents - sumMetered;
    if (meteredDistributions.length > 0) {
      meteredDistributions[0].amountCents += meteredRemainder;
    }

    // Build final distributions
    for (const unitId of allUnitIds) {
      const metered = meteredDistributions.find((m) => m.unitId === unitId);
      if (metered) {
        distributions.push({
          unitId,
          consumption: metered.consumption,
          percentage: totalConsumption > 0 ? (metered.consumption / totalConsumption) * 100 : 0,
          amountCents: metered.amountCents,
          isMetered: true,
        });
      } else {
        distributions.push({
          unitId,
          consumption: null,
          percentage: null,
          amountCents: 0,
          isMetered: false,
        });
      }
    }

    return {
      fiscalYear,
      totalWaterCents: waterTotalCents,
      totalConsumption,
      distributions,
    };
  }
}
