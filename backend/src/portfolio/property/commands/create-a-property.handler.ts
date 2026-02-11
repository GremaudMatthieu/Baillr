import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { PropertyAggregate } from '../property.aggregate.js';
import { CreateAPropertyCommand } from './create-a-property.command.js';

@CommandHandler(CreateAPropertyCommand)
export class CreateAPropertyHandler implements ICommandHandler<CreateAPropertyCommand> {
  constructor(
    @InjectAggregateRepository(PropertyAggregate)
    private readonly repository: AggregateRepository<PropertyAggregate>,
  ) {}

  async execute(command: CreateAPropertyCommand): Promise<void> {
    const property = new PropertyAggregate(command.id);
    property.create(command.userId, command.entityId, command.name, command.type, command.address);
    await this.repository.save(property);
  }
}
