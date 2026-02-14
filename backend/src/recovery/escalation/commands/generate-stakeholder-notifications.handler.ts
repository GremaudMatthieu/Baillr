import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EscalationAggregate } from '../escalation.aggregate.js';
import { GenerateStakeholderNotificationsCommand } from './generate-stakeholder-notifications.command.js';

@CommandHandler(GenerateStakeholderNotificationsCommand)
export class GenerateStakeholderNotificationsHandler
  implements ICommandHandler<GenerateStakeholderNotificationsCommand>
{
  constructor(
    @InjectAggregateRepository(EscalationAggregate)
    private readonly repository: AggregateRepository<EscalationAggregate>,
  ) {}

  async execute(command: GenerateStakeholderNotificationsCommand): Promise<void> {
    const { rentCallId, entityId, tenantId } = command;

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

    // Generate stakeholder notifications (tier 3)
    aggregate.generateStakeholderNotifications(new Date());

    await this.repository.save(aggregate);
  }
}
