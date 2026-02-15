import { Event } from 'nestjs-cqrx';
import type { MeterReadingPrimitives } from '../meter-reading.js';

export interface WaterMeterReadingsEnteredData {
  waterMeterReadingsId: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  readings: MeterReadingPrimitives[];
  totalConsumption: number;
  recordedAt: string;
}

export class WaterMeterReadingsEntered extends Event<WaterMeterReadingsEnteredData> {
  constructor(data: WaterMeterReadingsEnteredData) {
    super(data);
  }
}
