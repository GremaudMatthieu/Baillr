import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { UnitAggregate } from '../unit.aggregate.js';
import { CreateAUnitCommand } from './create-a-unit.command.js';

@CommandHandler(CreateAUnitCommand)
export class CreateAUnitHandler implements ICommandHandler<CreateAUnitCommand> {
  constructor(
    @InjectAggregateRepository(UnitAggregate)
    private readonly repository: AggregateRepository<UnitAggregate>,
  ) {}

  async execute(command: CreateAUnitCommand): Promise<void> {
    const unit = new UnitAggregate(command.id);
    unit.create(
      command.userId,
      command.propertyId,
      command.identifier,
      command.type,
      command.floor,
      command.surfaceArea,
      command.billableOptions,
    );
    await this.repository.save(unit);
  }
}
