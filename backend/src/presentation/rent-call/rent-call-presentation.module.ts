import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { GenerateRentCallsForMonthController } from './controllers/generate-rent-calls-for-month.controller.js';
import { GetRentCallsController } from './controllers/get-rent-calls.controller.js';
import { GetRentCallPdfController } from './controllers/get-rent-call-pdf.controller.js';
import { GetRentCallsHandler } from './queries/get-rent-calls.handler.js';
import { RentCallProjection } from './projections/rent-call.projection.js';
import { RentCallFinder } from './finders/rent-call.finder.js';
import { RentCallPdfAssembler } from './services/rent-call-pdf-assembler.service.js';
import { RentCallCalculationService } from '@billing/rent-call/rent-call-calculation.service';

@Module({
  imports: [CqrsModule, EntityPresentationModule, LeasePresentationModule],
  controllers: [GenerateRentCallsForMonthController, GetRentCallsController, GetRentCallPdfController],
  providers: [
    GetRentCallsHandler,
    RentCallProjection,
    RentCallFinder,
    RentCallPdfAssembler,
    RentCallCalculationService,
  ],
  exports: [RentCallFinder],
})
export class RentCallPresentationModule {}
