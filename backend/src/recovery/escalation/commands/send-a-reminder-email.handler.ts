import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EscalationAggregate } from '../escalation.aggregate.js';
import { SendAReminderEmailCommand } from './send-a-reminder-email.command.js';

@CommandHandler(SendAReminderEmailCommand)
export class SendAReminderEmailHandler implements ICommandHandler<SendAReminderEmailCommand> {
  constructor(
    @InjectAggregateRepository(EscalationAggregate)
    private readonly repository: AggregateRepository<EscalationAggregate>,
  ) {}

  async execute(command: SendAReminderEmailCommand): Promise<void> {
    const { rentCallId, entityId, tenantId, tenantEmail } = command;

    let aggregate: EscalationAggregate;
    try {
      aggregate = await this.repository.load(rentCallId);
    } catch (error: unknown) {
      if ((error as { type?: string }).type === 'stream-not-found') {
        aggregate = new EscalationAggregate(rentCallId);
      } else {
        throw error;
      }
    }

    // Initiate escalation if not yet started
    aggregate.initiate(rentCallId, entityId, tenantId);

    // Send tier 1 reminder
    aggregate.sendReminderEmail(tenantEmail, new Date());

    await this.repository.save(aggregate);
  }
}
