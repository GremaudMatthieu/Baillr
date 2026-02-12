import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { LeaseAggregate } from '../lease.aggregate.js';
import { TerminateALeaseCommand } from './terminate-a-lease.command.js';

@CommandHandler(TerminateALeaseCommand)
export class TerminateALeaseHandler implements ICommandHandler<TerminateALeaseCommand> {
  constructor(
    @InjectAggregateRepository(LeaseAggregate)
    private readonly repository: AggregateRepository<LeaseAggregate>,
  ) {}

  async execute(command: TerminateALeaseCommand): Promise<void> {
    const lease = await this.repository.load(command.leaseId);
    lease.terminate(command.endDate);
    await this.repository.save(lease);
  }
}
