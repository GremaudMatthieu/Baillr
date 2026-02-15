import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { ChargeRegularizationAggregate } from '../charge-regularization.aggregate.js';
import { CalculateChargeRegularizationCommand } from './calculate-charge-regularization.command.js';

@CommandHandler(CalculateChargeRegularizationCommand)
export class CalculateChargeRegularizationHandler
  implements ICommandHandler<CalculateChargeRegularizationCommand>
{
  constructor(
    @InjectAggregateRepository(ChargeRegularizationAggregate)
    private readonly repository: AggregateRepository<ChargeRegularizationAggregate>,
  ) {}

  async execute(command: CalculateChargeRegularizationCommand): Promise<void> {
    let aggregate: ChargeRegularizationAggregate;
    try {
      aggregate = await this.repository.load(command.id);
    } catch (error: unknown) {
      if ((error as { type?: string }).type === 'stream-not-found') {
        aggregate = new ChargeRegularizationAggregate(command.id);
      } else {
        throw error;
      }
    }
    aggregate.calculate(
      command.entityId,
      command.userId,
      command.fiscalYear,
      command.statements,
    );
    await this.repository.save(aggregate);
  }
}
