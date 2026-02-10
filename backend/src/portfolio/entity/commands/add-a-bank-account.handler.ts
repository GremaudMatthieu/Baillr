import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { AddABankAccountCommand } from './add-a-bank-account.command.js';

@CommandHandler(AddABankAccountCommand)
export class AddABankAccountHandler implements ICommandHandler<AddABankAccountCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: AddABankAccountCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.addBankAccount(
      command.userId,
      command.accountId,
      command.type,
      command.label,
      command.iban,
      command.bic,
      command.bankName,
      command.isDefault,
    );
    await this.repository.save(entity);
  }
}
