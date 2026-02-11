import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { PropertyAggregate } from '../property.aggregate.js';
import { UpdateAPropertyCommand } from './update-a-property.command.js';

@CommandHandler(UpdateAPropertyCommand)
export class UpdateAPropertyHandler implements ICommandHandler<UpdateAPropertyCommand> {
  constructor(
    @InjectAggregateRepository(PropertyAggregate)
    private readonly repository: AggregateRepository<PropertyAggregate>,
  ) {}

  async execute(command: UpdateAPropertyCommand): Promise<void> {
    const property = await this.repository.load(command.id);
    property.update(command.userId, {
      name: command.name,
      type: command.type,
      address: command.address,
    });
    await this.repository.save(property);
  }
}
