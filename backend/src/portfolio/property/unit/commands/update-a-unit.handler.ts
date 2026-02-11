import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { UnitAggregate } from '../unit.aggregate.js';
import { UpdateAUnitCommand } from './update-a-unit.command.js';

@CommandHandler(UpdateAUnitCommand)
export class UpdateAUnitHandler implements ICommandHandler<UpdateAUnitCommand> {
  constructor(
    @InjectAggregateRepository(UnitAggregate)
    private readonly repository: AggregateRepository<UnitAggregate>,
  ) {}

  async execute(command: UpdateAUnitCommand): Promise<void> {
    const unit = await this.repository.load(command.id);
    unit.update(command.userId, {
      identifier: command.identifier,
      type: command.type,
      floor: command.floor,
      surfaceArea: command.surfaceArea,
      billableOptions: command.billableOptions,
    });
    await this.repository.save(unit);
  }
}
