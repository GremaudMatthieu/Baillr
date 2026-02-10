import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { RemoveABankAccountCommand } from './remove-a-bank-account.command.js';

@CommandHandler(RemoveABankAccountCommand)
export class RemoveABankAccountHandler implements ICommandHandler<RemoveABankAccountCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: RemoveABankAccountCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.removeBankAccount(command.userId, command.accountId);
    await this.repository.save(entity);
  }
}
