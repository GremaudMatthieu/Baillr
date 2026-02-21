import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EscalationAggregate } from '../escalation.aggregate.js';
import { UpdateRegisteredMailStatusCommand } from './update-registered-mail-status.command.js';

@CommandHandler(UpdateRegisteredMailStatusCommand)
export class UpdateRegisteredMailStatusHandler
  implements ICommandHandler<UpdateRegisteredMailStatusCommand>
{
  constructor(
    @InjectAggregateRepository(EscalationAggregate)
    private readonly repository: AggregateRepository<EscalationAggregate>,
  ) {}

  async execute(command: UpdateRegisteredMailStatusCommand): Promise<void> {
    const { rentCallId, status, proofUrl } = command;

    const aggregate = await this.repository.load(rentCallId);
    aggregate.updateRegisteredMailStatus(status, proofUrl);
    await this.repository.save(aggregate);
  }
}
