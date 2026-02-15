import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { AnnualChargesPresentationModule } from '../annual-charges/annual-charges-presentation.module.js';
import { WaterMeterReadingsAggregate } from '@indexation/water-meter-readings/water-meter-readings.aggregate';
import { RecordWaterMeterReadingsHandler } from '@indexation/water-meter-readings/commands/record-water-meter-readings.handler';
import { RecordWaterMeterReadingsController } from './controllers/record-water-meter-readings.controller.js';
import { GetWaterMeterReadingsController } from './controllers/get-water-meter-readings.controller.js';
import { GetWaterDistributionController } from './controllers/get-water-distribution.controller.js';
import { GetWaterMeterReadingsHandler } from './queries/get-water-meter-readings.handler.js';
import { GetWaterDistributionHandler } from './queries/get-water-distribution.handler.js';
import { WaterMeterReadingsProjection } from './projections/water-meter-readings.projection.js';
import { WaterMeterReadingsFinder } from './finders/water-meter-readings.finder.js';
import { WaterDistributionService } from './services/water-distribution.service.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([WaterMeterReadingsAggregate]),
    EntityPresentationModule,
    AnnualChargesPresentationModule,
  ],
  controllers: [
    RecordWaterMeterReadingsController,
    GetWaterMeterReadingsController,
    GetWaterDistributionController,
  ],
  providers: [
    RecordWaterMeterReadingsHandler,
    GetWaterMeterReadingsHandler,
    GetWaterDistributionHandler,
    WaterMeterReadingsProjection,
    WaterMeterReadingsFinder,
    WaterDistributionService,
  ],
  exports: [WaterMeterReadingsFinder],
})
export class WaterMeterReadingsPresentationModule {}
