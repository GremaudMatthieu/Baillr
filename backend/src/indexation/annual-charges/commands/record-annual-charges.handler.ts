import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { AnnualChargesAggregate } from '../annual-charges.aggregate.js';
import { RecordAnnualChargesCommand } from './record-annual-charges.command.js';

@CommandHandler(RecordAnnualChargesCommand)
export class RecordAnnualChargesHandler
  implements ICommandHandler<RecordAnnualChargesCommand>
{
  constructor(
    @InjectAggregateRepository(AnnualChargesAggregate)
    private readonly repository: AggregateRepository<AnnualChargesAggregate>,
  ) {}

  async execute(command: RecordAnnualChargesCommand): Promise<void> {
    let aggregate: AnnualChargesAggregate;
    try {
      aggregate = await this.repository.load(command.id);
    } catch (error: unknown) {
      if ((error as { type?: string }).type === 'stream-not-found') {
        aggregate = new AnnualChargesAggregate(command.id);
      } else {
        throw error;
      }
    }
    aggregate.record(
      command.entityId,
      command.userId,
      command.fiscalYear,
      command.charges,
    );
    await this.repository.save(aggregate);
  }
}
