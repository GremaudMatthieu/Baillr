import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { UpdateAnEntityCommand } from './update-an-entity.command.js';

@CommandHandler(UpdateAnEntityCommand)
export class UpdateAnEntityHandler implements ICommandHandler<UpdateAnEntityCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: UpdateAnEntityCommand): Promise<void> {
    const entity = await this.repository.load(command.id);
    entity.update(command.userId, {
      name: command.name,
      email: command.email,
      siret: command.siret,
      address: command.address,
      legalInformation: command.legalInformation,
    });
    await this.repository.save(entity);
  }
}
