import type { MeterReadingPrimitives } from '../meter-reading.js';

export class RecordWaterMeterReadingsCommand {
  constructor(
    public readonly id: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly fiscalYear: number,
    public readonly readings: MeterReadingPrimitives[],
  ) {}
}
