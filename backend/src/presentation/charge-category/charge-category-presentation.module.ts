import { Module } from '@nestjs/common';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { GetChargeCategoriesController } from './controllers/get-charge-categories.controller.js';
import { CreateChargeCategoryController } from './controllers/create-charge-category.controller.js';
import { ChargeCategoryFinder } from './finders/charge-category.finder.js';
import { ChargeCategorySeeder } from './charge-category-seeder.js';

@Module({
  imports: [EntityPresentationModule],
  controllers: [GetChargeCategoriesController, CreateChargeCategoryController],
  providers: [ChargeCategoryFinder, ChargeCategorySeeder],
  exports: [ChargeCategoryFinder, ChargeCategorySeeder],
})
export class ChargeCategoryPresentationModule {}
