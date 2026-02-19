import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { LinkABankConnectionCommand } from './link-a-bank-connection.command.js';

@CommandHandler(LinkABankConnectionCommand)
export class LinkABankConnectionHandler implements ICommandHandler<LinkABankConnectionCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: LinkABankConnectionCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.linkBankConnection(
      command.userId,
      command.connectionId,
      command.bankAccountId,
      command.provider,
      command.institutionId,
      command.institutionName,
      command.requisitionId,
      command.agreementId,
      command.agreementExpiry,
      command.accountIds,
    );
    await this.repository.save(entity);
  }
}
