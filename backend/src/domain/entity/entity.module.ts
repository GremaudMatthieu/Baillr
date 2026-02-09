import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityAggregate } from './entity.aggregate.js';
import { CreateAnEntityHandler } from './commands/create-an-entity.handler.js';
import { UpdateAnEntityHandler } from './commands/update-an-entity.handler.js';

@Module({
  imports: [CqrxModule.forFeature([EntityAggregate])],
  providers: [CreateAnEntityHandler, UpdateAnEntityHandler],
})
export class EntityDomainModule {}
