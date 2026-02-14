import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EscalationAggregate } from '../escalation.aggregate.js';
import { GenerateAFormalNoticeCommand } from './generate-a-formal-notice.command.js';

@CommandHandler(GenerateAFormalNoticeCommand)
export class GenerateAFormalNoticeHandler
  implements ICommandHandler<GenerateAFormalNoticeCommand>
{
  constructor(
    @InjectAggregateRepository(EscalationAggregate)
    private readonly repository: AggregateRepository<EscalationAggregate>,
  ) {}

  async execute(command: GenerateAFormalNoticeCommand): Promise<void> {
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

    // Generate formal notice (tier 2)
    aggregate.generateFormalNotice(new Date());

    await this.repository.save(aggregate);
  }
}
