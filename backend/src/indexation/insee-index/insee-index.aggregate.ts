import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { IndexType } from './index-type.js';
import { IndexQuarter } from './index-quarter.js';
import { IndexYear } from './index-year.js';
import { IndexValue } from './index-value.js';
import { IndexRecorded } from './events/index-recorded.event.js';

export class InseeIndexAggregate extends AggregateRoot {
  private type!: string;
  private quarter!: string;
  private year!: number;
  private indexValue!: number;
  private entityId!: string;
  private recorded = false;

  static readonly streamName = 'insee-index';

  record(
    type: string,
    quarter: string,
    year: number,
    value: number,
    entityId: string,
    userId: string,
    source: string = 'manual',
  ): void {
    if (this.recorded) {
      return; // no-op guard for replays
    }

    // Validate all VOs — will throw named exceptions on invalid data
    const indexType = IndexType.fromString(type);
    const indexQuarter = IndexQuarter.fromString(quarter);
    const indexYear = IndexYear.create(year);
    const indexValue = IndexValue.create(value);

    this.apply(
      new IndexRecorded({
        indexId: this.id,
        type: indexType.value,
        quarter: indexQuarter.value,
        year: indexYear.value,
        value: indexValue.value,
        entityId,
        userId,
        recordedAt: new Date().toISOString(),
        source,
      }),
    );
  }

  @EventHandler(IndexRecorded)
  onIndexRecorded(event: IndexRecorded): void {
    this.type = event.data.type;
    this.quarter = event.data.quarter;
    this.year = event.data.year;
    this.indexValue = event.data.value;
    this.entityId = event.data.entityId;
    this.recorded = true;
  }
}
