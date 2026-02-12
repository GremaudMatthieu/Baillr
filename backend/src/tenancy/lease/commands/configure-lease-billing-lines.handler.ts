import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { LeaseAggregate } from '../lease.aggregate.js';
import { ConfigureLeaseBillingLinesCommand } from './configure-lease-billing-lines.command.js';

@CommandHandler(ConfigureLeaseBillingLinesCommand)
export class ConfigureLeaseBillingLinesHandler implements ICommandHandler<ConfigureLeaseBillingLinesCommand> {
  constructor(
    @InjectAggregateRepository(LeaseAggregate)
    private readonly repository: AggregateRepository<LeaseAggregate>,
  ) {}

  async execute(command: ConfigureLeaseBillingLinesCommand): Promise<void> {
    const lease = await this.repository.load(command.leaseId);
    lease.configureBillingLines(command.billingLines);
    await this.repository.save(lease);
  }
}
