import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { CreateAnEntityCommand } from './create-an-entity.command.js';

@CommandHandler(CreateAnEntityCommand)
export class CreateAnEntityHandler implements ICommandHandler<CreateAnEntityCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: CreateAnEntityCommand): Promise<void> {
    const entity = new EntityAggregate(command.id);
    entity.create(
      command.userId,
      command.type,
      command.name,
      command.email,
      command.siret,
      command.address,
      command.legalInformation,
    );
    await this.repository.save(entity);
  }
}
