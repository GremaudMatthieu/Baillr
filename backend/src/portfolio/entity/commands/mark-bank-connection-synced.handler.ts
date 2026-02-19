import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { MarkBankConnectionSyncedCommand } from './mark-bank-connection-synced.command.js';

@CommandHandler(MarkBankConnectionSyncedCommand)
export class MarkBankConnectionSyncedHandler
  implements ICommandHandler<MarkBankConnectionSyncedCommand>
{
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: MarkBankConnectionSyncedCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.markBankConnectionSynced(command.connectionId, command.lastSyncedAt);
    await this.repository.save(entity);
  }
}
