import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate.js';
import { ApplyChargeRegularizationCommand } from './apply-charge-regularization.command.js';

@CommandHandler(ApplyChargeRegularizationCommand)
export class ApplyChargeRegularizationHandler
  implements ICommandHandler<ApplyChargeRegularizationCommand>
{
  constructor(
    @InjectAggregateRepository(ChargeRegularizationAggregate)
    private readonly repository: AggregateRepository<ChargeRegularizationAggregate>,
  ) {}

  async execute(command: ApplyChargeRegularizationCommand): Promise<void> {
    const aggregate = await this.repository.load(command.id);
    aggregate.applyRegularization(
      command.entityId,
      command.userId,
      command.fiscalYear,
    );
    await this.repository.save(aggregate);
  }
}
