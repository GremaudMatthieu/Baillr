import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { ConfigureLatePaymentDelayCommand } from './configure-late-payment-delay.command.js';

@CommandHandler(ConfigureLatePaymentDelayCommand)
export class ConfigureLatePaymentDelayHandler
  implements ICommandHandler<ConfigureLatePaymentDelayCommand>
{
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: ConfigureLatePaymentDelayCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.configureLatePaymentDelay(command.userId, command.days);
    await this.repository.save(entity);
  }
}
