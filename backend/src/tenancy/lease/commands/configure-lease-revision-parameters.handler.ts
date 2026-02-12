import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { LeaseAggregate } from '../lease.aggregate.js';
import { ConfigureLeaseRevisionParametersCommand } from './configure-lease-revision-parameters.command.js';

@CommandHandler(ConfigureLeaseRevisionParametersCommand)
export class ConfigureLeaseRevisionParametersHandler implements ICommandHandler<ConfigureLeaseRevisionParametersCommand> {
  constructor(
    @InjectAggregateRepository(LeaseAggregate)
    private readonly repository: AggregateRepository<LeaseAggregate>,
  ) {}

  async execute(command: ConfigureLeaseRevisionParametersCommand): Promise<void> {
    const lease = await this.repository.load(command.leaseId);
    lease.configureRevisionParameters(
      command.revisionDay,
      command.revisionMonth,
      command.referenceQuarter,
      command.referenceYear,
      command.baseIndexValue,
    );
    await this.repository.save(lease);
  }
}
