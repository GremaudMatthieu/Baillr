import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { CreateAPropertyController } from './controllers/create-a-property.controller.js';
import { UpdateAPropertyController } from './controllers/update-a-property.controller.js';
import { GetPropertiesController } from './controllers/get-properties.controller.js';
import { GetAPropertyController } from './controllers/get-a-property.controller.js';
import { CreateAUnitController } from './controllers/create-a-unit.controller.js';
import { UpdateAUnitController } from './controllers/update-a-unit.controller.js';
import { GetUnitsController } from './controllers/get-units.controller.js';
import { GetAUnitController } from './controllers/get-a-unit.controller.js';
import { GetUnitsByEntityController } from './controllers/get-units-by-entity.controller.js';
import { GetPropertiesHandler } from './queries/get-properties.handler.js';
import { GetAPropertyHandler } from './queries/get-a-property.handler.js';
import { GetUnitsHandler } from './queries/get-units.handler.js';
import { GetAUnitHandler } from './queries/get-a-unit.handler.js';
import { GetUnitsByEntityHandler } from './queries/get-units-by-entity.handler.js';
import { PropertyProjection } from './projections/property.projection.js';
import { UnitProjection } from './projections/unit.projection.js';
import { PropertyFinder } from './finders/property.finder.js';
import { UnitFinder } from './finders/unit.finder.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [
    CreateAPropertyController,
    UpdateAPropertyController,
    GetPropertiesController,
    GetAPropertyController,
    CreateAUnitController,
    UpdateAUnitController,
    GetUnitsController,
    GetAUnitController,
    GetUnitsByEntityController,
  ],
  providers: [
    GetPropertiesHandler,
    GetAPropertyHandler,
    GetUnitsHandler,
    GetAUnitHandler,
    GetUnitsByEntityHandler,
    PropertyProjection,
    UnitProjection,
    PropertyFinder,
    UnitFinder,
  ],
  exports: [PropertyFinder, UnitFinder],
})
export class PropertyPresentationModule {}
