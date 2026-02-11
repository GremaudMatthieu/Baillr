import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { CreateAPropertyController } from './controllers/create-a-property.controller.js';
import { UpdateAPropertyController } from './controllers/update-a-property.controller.js';
import { GetPropertiesController } from './controllers/get-properties.controller.js';
import { GetAPropertyController } from './controllers/get-a-property.controller.js';
import { GetPropertiesHandler } from './queries/get-properties.handler.js';
import { GetAPropertyHandler } from './queries/get-a-property.handler.js';
import { PropertyProjection } from './projections/property.projection.js';
import { PropertyFinder } from './finders/property.finder.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [
    CreateAPropertyController,
    UpdateAPropertyController,
    GetPropertiesController,
    GetAPropertyController,
  ],
  providers: [GetPropertiesHandler, GetAPropertyHandler, PropertyProjection, PropertyFinder],
})
export class PropertyPresentationModule {}
