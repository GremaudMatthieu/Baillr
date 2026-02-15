import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { AnnualChargesPresentationModule } from '../annual-charges/annual-charges-presentation.module.js';
import { WaterMeterReadingsPresentationModule } from '../water-meter-readings/water-meter-readings-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { TenantPresentationModule } from '../tenant/tenant-presentation.module.js';
import { PropertyPresentationModule } from '../property/property-presentation.module.js';
import { ChargeRegularizationAggregate } from '@indexation/charge-regularization/charge-regularization.aggregate';
import { CalculateChargeRegularizationHandler } from '@indexation/charge-regularization/commands/calculate-charge-regularization.handler';
import { CalculateChargeRegularizationController } from './controllers/calculate-charge-regularization.controller.js';
import { GetChargeRegularizationController } from './controllers/get-charge-regularization.controller.js';
import { GetChargeRegularizationPdfController } from './controllers/get-charge-regularization-pdf.controller.js';
import { GetChargeRegularizationHandler } from './queries/get-charge-regularization.handler.js';
import { ChargeRegularizationProjection } from './projections/charge-regularization.projection.js';
import { ChargeRegularizationFinder } from './finders/charge-regularization.finder.js';
import { RegularizationCalculationService } from './services/regularization-calculation.service.js';
import { ChargeRegularizationPdfAssembler } from './services/charge-regularization-pdf-assembler.service.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([ChargeRegularizationAggregate]),
    EntityPresentationModule,
    AnnualChargesPresentationModule,
    WaterMeterReadingsPresentationModule,
    LeasePresentationModule,
    TenantPresentationModule,
    PropertyPresentationModule,
  ],
  controllers: [
    CalculateChargeRegularizationController,
    GetChargeRegularizationController,
    GetChargeRegularizationPdfController,
  ],
  providers: [
    CalculateChargeRegularizationHandler,
    GetChargeRegularizationHandler,
    ChargeRegularizationProjection,
    ChargeRegularizationFinder,
    RegularizationCalculationService,
    ChargeRegularizationPdfAssembler,
  ],
  exports: [ChargeRegularizationFinder],
})
export class ChargeRegularizationPresentationModule {}
