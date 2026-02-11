import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { UnitAggregate } from './unit.aggregate.js';
import { CreateAUnitHandler } from './commands/create-a-unit.handler.js';
import { UpdateAUnitHandler } from './commands/update-a-unit.handler.js';

@Module({
  imports: [CqrxModule.forFeature([UnitAggregate])],
  providers: [CreateAUnitHandler, UpdateAUnitHandler],
})
export class UnitDomainModule {}
