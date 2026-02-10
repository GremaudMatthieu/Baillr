import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { UpdateABankAccountCommand } from './update-a-bank-account.command.js';

@CommandHandler(UpdateABankAccountCommand)
export class UpdateABankAccountHandler implements ICommandHandler<UpdateABankAccountCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: UpdateABankAccountCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.updateBankAccount(command.userId, command.accountId, {
      label: command.label,
      iban: command.iban,
      bic: command.bic,
      bankName: command.bankName,
      isDefault: command.isDefault,
    });
    await this.repository.save(entity);
  }
}
