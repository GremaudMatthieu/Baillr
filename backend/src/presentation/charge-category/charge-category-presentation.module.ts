import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { GetChargeCategoriesController } from './controllers/get-charge-categories.controller.js';
import { CreateChargeCategoryController } from './controllers/create-charge-category.controller.js';
import { GetChargeCategoriesHandler } from './queries/get-charge-categories.handler.js';
import { ChargeCategoryFinder } from './finders/charge-category.finder.js';
import { ChargeCategorySeeder } from './charge-category-seeder.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [GetChargeCategoriesController, CreateChargeCategoryController],
  providers: [GetChargeCategoriesHandler, ChargeCategoryFinder, ChargeCategorySeeder],
  exports: [ChargeCategoryFinder, ChargeCategorySeeder],
})
export class ChargeCategoryPresentationModule {}
