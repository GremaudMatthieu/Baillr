import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import {
  WaterMeterReadingsEntered,
  type WaterMeterReadingsEnteredData,
} from './events/water-meter-readings-entered.event.js';
import { MeterReading, type MeterReadingPrimitives } from './meter-reading.js';
import { WaterConsumption } from './water-consumption.js';
import { FiscalYear } from '@indexation/annual-charges/fiscal-year.js';

export class WaterMeterReadingsAggregate extends AggregateRoot {
  static readonly streamName = 'water-meter-readings';

  private recorded = false;
  private readings: MeterReadingPrimitives[] = [];
  private totalConsumption = 0;

  record(
    entityId: string,
    userId: string,
    fiscalYear: number,
    readings: MeterReadingPrimitives[],
  ): void {
    // Validate VOs
    FiscalYear.create(fiscalYear);
    const entries = readings.map((r) => MeterReading.fromPrimitives(r));
    const totalConsumption = entries.reduce((sum, e) => sum + e.consumption, 0);

    // Validate total consumption VO
    WaterConsumption.create(totalConsumption);

    const readingsPrimitives = entries.map((e) => e.toPrimitives());

    // No-op guard: skip if data is identical to current state
    if (this.recorded && this.isSameData(readingsPrimitives, totalConsumption)) {
      return;
    }

    this.apply(
      new WaterMeterReadingsEntered({
        waterMeterReadingsId: this.id,
        entityId,
        userId,
        fiscalYear,
        readings: readingsPrimitives,
        totalConsumption,
        recordedAt: new Date().toISOString(),
      }),
    );
  }

  private isSameData(
    readings: MeterReadingPrimitives[],
    totalConsumption: number,
  ): boolean {
    if (this.totalConsumption !== totalConsumption) return false;
    if (this.readings.length !== readings.length) return false;
    return this.readings.every(
      (existing, i) =>
        existing.unitId === readings[i].unitId &&
        existing.previousReading === readings[i].previousReading &&
        existing.currentReading === readings[i].currentReading &&
        existing.readingDate === readings[i].readingDate,
    );
  }

  @EventHandler(WaterMeterReadingsEntered)
  onWaterMeterReadingsEntered(event: WaterMeterReadingsEntered): void {
    this.recorded = true;
    this.readings = event.data.readings;
    this.totalConsumption = event.data.totalConsumption;
  }
}
