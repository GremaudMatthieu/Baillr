import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { LeaseAggregate } from '../lease.aggregate.js';
import { CreateALeaseCommand } from './create-a-lease.command.js';

@CommandHandler(CreateALeaseCommand)
export class CreateALeaseHandler implements ICommandHandler<CreateALeaseCommand> {
  constructor(
    @InjectAggregateRepository(LeaseAggregate)
    private readonly repository: AggregateRepository<LeaseAggregate>,
  ) {}

  async execute(command: CreateALeaseCommand): Promise<void> {
    const lease = new LeaseAggregate(command.id);
    lease.create(
      command.userId,
      command.entityId,
      command.tenantId,
      command.unitId,
      command.startDate,
      command.rentAmountCents,
      command.securityDepositCents,
      command.monthlyDueDate,
      command.revisionIndexType,
    );
    await this.repository.save(lease);
  }
}
