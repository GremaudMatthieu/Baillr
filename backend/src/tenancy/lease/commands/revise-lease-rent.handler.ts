import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { LeaseAggregate } from '../lease.aggregate.js';
import { ReviseLeaseRentCommand } from './revise-lease-rent.command.js';

@CommandHandler(ReviseLeaseRentCommand)
export class ReviseLeaseRentHandler implements ICommandHandler<ReviseLeaseRentCommand> {
  constructor(
    @InjectAggregateRepository(LeaseAggregate)
    private readonly repository: AggregateRepository<LeaseAggregate>,
  ) {}

  async execute(command: ReviseLeaseRentCommand): Promise<void> {
    const lease = await this.repository.load(command.leaseId);
    lease.reviseRent(
      command.newRentCents,
      command.newBaseIndexValue,
      command.newReferenceQuarter,
      command.newReferenceYear,
      command.revisionId,
    );
    await this.repository.save(lease);
  }
}
