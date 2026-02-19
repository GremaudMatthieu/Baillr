import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { DisconnectABankConnectionCommand } from './disconnect-a-bank-connection.command.js';

@CommandHandler(DisconnectABankConnectionCommand)
export class DisconnectABankConnectionHandler
  implements ICommandHandler<DisconnectABankConnectionCommand>
{
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: DisconnectABankConnectionCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.disconnectBankConnection(command.userId, command.connectionId);
    await this.repository.save(entity);
  }
}
