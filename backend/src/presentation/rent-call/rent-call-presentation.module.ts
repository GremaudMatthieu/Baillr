import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { GenerateRentCallsForMonthController } from './controllers/generate-rent-calls-for-month.controller.js';
import { GetRentCallsController } from './controllers/get-rent-calls.controller.js';
import { GetRentCallPdfController } from './controllers/get-rent-call-pdf.controller.js';
import { SendRentCallsByEmailController } from './controllers/send-rent-calls-by-email.controller.js';
import { GetRentCallsHandler } from './queries/get-rent-calls.handler.js';
import { GenerateRentCallsForMonthHandler } from '@billing/rent-call/commands/generate-rent-calls-for-month.handler';
import { SendRentCallsByEmailHandler } from '@billing/rent-call/commands/send-rent-calls-by-email.handler';
import { RentCallProjection } from './projections/rent-call.projection.js';
import { RentCallFinder } from './finders/rent-call.finder.js';
import { RentCallPdfAssembler } from './services/rent-call-pdf-assembler.service.js';
import { RentCallCalculationService } from '@billing/rent-call/rent-call-calculation.service';
import { RentCallAggregate } from '@billing/rent-call/rent-call.aggregate';

@Module({
  imports: [CqrsModule, CqrxModule.forFeature([RentCallAggregate]), EntityPresentationModule, LeasePresentationModule],
  controllers: [GenerateRentCallsForMonthController, GetRentCallsController, GetRentCallPdfController, SendRentCallsByEmailController],
  providers: [
    GetRentCallsHandler,
    GenerateRentCallsForMonthHandler,
    SendRentCallsByEmailHandler,
    RentCallProjection,
    RentCallFinder,
    RentCallPdfAssembler,
    RentCallCalculationService,
  ],
  exports: [RentCallFinder],
})
export class RentCallPresentationModule {}
