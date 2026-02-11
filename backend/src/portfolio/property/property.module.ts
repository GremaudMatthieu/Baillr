import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { PropertyAggregate } from './property.aggregate.js';
import { CreateAPropertyHandler } from './commands/create-a-property.handler.js';
import { UpdateAPropertyHandler } from './commands/update-a-property.handler.js';

@Module({
  imports: [CqrxModule.forFeature([PropertyAggregate])],
  providers: [CreateAPropertyHandler, UpdateAPropertyHandler],
})
export class PropertyDomainModule {}
