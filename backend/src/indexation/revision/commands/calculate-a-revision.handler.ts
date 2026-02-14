import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RevisionAggregate } from '../revision.aggregate.js';
import { IndexCalculatorService } from '../services/index-calculator.service.js';
import { CalculateARevisionCommand } from './calculate-a-revision.command.js';

@CommandHandler(CalculateARevisionCommand)
export class CalculateARevisionHandler
  implements ICommandHandler<CalculateARevisionCommand>
{
  constructor(
    @InjectAggregateRepository(RevisionAggregate)
    private readonly repository: AggregateRepository<RevisionAggregate>,
  ) {}

  async execute(command: CalculateARevisionCommand): Promise<void> {
    const aggregate = new RevisionAggregate(command.id);
    const calculator = new IndexCalculatorService();

    aggregate.calculateRevision(
      command.leaseId,
      command.entityId,
      command.userId,
      command.tenantId,
      command.unitId,
      command.tenantName,
      command.unitLabel,
      command.currentRentCents,
      command.baseIndexValue,
      command.baseIndexQuarter,
      command.newIndexValue,
      command.newIndexQuarter,
      command.newIndexYear,
      command.revisionIndexType,
      calculator,
    );

    await this.repository.save(aggregate);
  }
}
