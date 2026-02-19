import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { MarkBankConnectionExpiredCommand } from './mark-bank-connection-expired.command.js';

@CommandHandler(MarkBankConnectionExpiredCommand)
export class MarkBankConnectionExpiredHandler
  implements ICommandHandler<MarkBankConnectionExpiredCommand>
{
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: MarkBankConnectionExpiredCommand): Promise<void> {
    const entity = await this.repository.load(command.entityId);
    entity.markBankConnectionExpired(command.connectionId);
    await this.repository.save(entity);
  }
}
