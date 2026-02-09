import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateAnEntityController } from './controllers/create-an-entity.controller.js';
import { UpdateAnEntityController } from './controllers/update-an-entity.controller.js';
import { GetEntitiesController } from './controllers/get-entities.controller.js';
import { GetAnEntityController } from './controllers/get-an-entity.controller.js';
import { GetEntitiesHandler } from './queries/get-entities.handler.js';
import { GetAnEntityHandler } from './queries/get-an-entity.handler.js';
import { EntityProjection } from './projections/entity.projection.js';
import { EntityRepository } from './repositories/entity.repository.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateAnEntityController,
    UpdateAnEntityController,
    GetEntitiesController,
    GetAnEntityController,
  ],
  providers: [GetEntitiesHandler, GetAnEntityHandler, EntityProjection, EntityRepository],
})
export class EntityPresentationModule {}
