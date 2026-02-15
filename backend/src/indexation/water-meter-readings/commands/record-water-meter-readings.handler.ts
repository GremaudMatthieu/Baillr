import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { WaterMeterReadingsAggregate } from '../water-meter-readings.aggregate.js';
import { RecordWaterMeterReadingsCommand } from './record-water-meter-readings.command.js';

@CommandHandler(RecordWaterMeterReadingsCommand)
export class RecordWaterMeterReadingsHandler
  implements ICommandHandler<RecordWaterMeterReadingsCommand>
{
  constructor(
    @InjectAggregateRepository(WaterMeterReadingsAggregate)
    private readonly repository: AggregateRepository<WaterMeterReadingsAggregate>,
  ) {}

  async execute(command: RecordWaterMeterReadingsCommand): Promise<void> {
    let aggregate: WaterMeterReadingsAggregate;
    try {
      aggregate = await this.repository.load(command.id);
    } catch (error: unknown) {
      if ((error as { type?: string }).type === 'stream-not-found') {
        aggregate = new WaterMeterReadingsAggregate(command.id);
      } else {
        throw error;
      }
    }
    aggregate.record(
      command.entityId,
      command.userId,
      command.fiscalYear,
      command.readings,
    );
    await this.repository.save(aggregate);
  }
}
