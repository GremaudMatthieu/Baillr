import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate.js';
import { SettleChargeRegularizationCommand } from './settle-charge-regularization.command.js';

@CommandHandler(SettleChargeRegularizationCommand)
export class SettleChargeRegularizationHandler
  implements ICommandHandler<SettleChargeRegularizationCommand>
{
  constructor(
    @InjectAggregateRepository(ChargeRegularizationAggregate)
    private readonly repository: AggregateRepository<ChargeRegularizationAggregate>,
  ) {}

  async execute(command: SettleChargeRegularizationCommand): Promise<void> {
    const aggregate = await this.repository.load(command.id);
    aggregate.markAsSettled(
      command.entityId,
      command.userId,
      command.fiscalYear,
    );
    await this.repository.save(aggregate);
  }
}
