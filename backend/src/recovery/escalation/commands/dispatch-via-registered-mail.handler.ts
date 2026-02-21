import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EscalationAggregate } from '../escalation.aggregate.js';
import { DispatchViaRegisteredMailCommand } from './dispatch-via-registered-mail.command.js';

@CommandHandler(DispatchViaRegisteredMailCommand)
export class DispatchViaRegisteredMailHandler
  implements ICommandHandler<DispatchViaRegisteredMailCommand>
{
  constructor(
    @InjectAggregateRepository(EscalationAggregate)
    private readonly repository: AggregateRepository<EscalationAggregate>,
  ) {}

  async execute(command: DispatchViaRegisteredMailCommand): Promise<void> {
    const { rentCallId, entityId, tenantId, trackingId, provider, costCents } =
      command;

    let aggregate: EscalationAggregate;
    try {
      aggregate = await this.repository.load(rentCallId);
    } catch (error: unknown) {
      if ((error as { type?: string }).type === 'stream-not-found') {
        aggregate = new EscalationAggregate(rentCallId);
        aggregate.initiate(rentCallId, entityId, tenantId);
      } else {
        throw error;
      }
    }

    // Dispatch via registered mail (requires formal notice to be generated)
    aggregate.dispatchViaRegisteredMail(trackingId, provider, costCents);

    await this.repository.save(aggregate);
  }
}
