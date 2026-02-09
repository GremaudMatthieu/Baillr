import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { EntityAggregate } from '../entity.aggregate.js';
import { UpdateAnEntityCommand } from './update-an-entity.command.js';
import { UnauthorizedEntityAccessException } from '../exceptions/unauthorized-entity-access.exception.js';

@CommandHandler(UpdateAnEntityCommand)
export class UpdateAnEntityHandler implements ICommandHandler<UpdateAnEntityCommand> {
  constructor(
    @InjectAggregateRepository(EntityAggregate)
    private readonly repository: AggregateRepository<EntityAggregate>,
  ) {}

  async execute(command: UpdateAnEntityCommand): Promise<void> {
    const entity = await this.repository.load(command.id);
    if (entity.ownerUserId !== command.userId) {
      throw UnauthorizedEntityAccessException.create();
    }
    entity.update({
      name: command.name,
      siret: command.siret,
      address: command.address,
      legalInformation: command.legalInformation,
    });
    await this.repository.save(entity);
  }
}
