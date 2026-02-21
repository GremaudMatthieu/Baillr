import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { InseeIndexAggregate } from '../insee-index.aggregate.js';
import { RecordAnInseeIndexCommand } from './record-an-insee-index.command.js';

@CommandHandler(RecordAnInseeIndexCommand)
export class RecordAnInseeIndexHandler
  implements ICommandHandler<RecordAnInseeIndexCommand>
{
  constructor(
    @InjectAggregateRepository(InseeIndexAggregate)
    private readonly repository: AggregateRepository<InseeIndexAggregate>,
  ) {}

  async execute(command: RecordAnInseeIndexCommand): Promise<void> {
    const aggregate = new InseeIndexAggregate(command.id);
    aggregate.record(
      command.type,
      command.quarter,
      command.year,
      command.value,
      command.entityId,
      command.userId,
      command.source,
    );
    await this.repository.save(aggregate);
  }
}
