import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { GenerateRentCallsForMonthController } from './controllers/generate-rent-calls-for-month.controller.js';
import { GetRentCallsController } from './controllers/get-rent-calls.controller.js';
import { GetRentCallPdfController } from './controllers/get-rent-call-pdf.controller.js';
import { GetReceiptPdfController } from './controllers/get-receipt-pdf.controller.js';
import { SendRentCallsByEmailController } from './controllers/send-rent-calls-by-email.controller.js';
import { RecordManualPaymentController } from './controllers/record-manual-payment.controller.js';
import { GetTenantAccountController } from './controllers/get-tenant-account.controller.js';
import { GetRentCallPaymentsController } from './controllers/get-rent-call-payments.controller.js';
import { GetRentCallsHandler } from './queries/get-rent-calls.handler.js';
import { GenerateRentCallsForMonthHandler } from '@billing/rent-call/commands/generate-rent-calls-for-month.handler';
import { SendRentCallsByEmailHandler } from '@billing/rent-call/commands/send-rent-calls-by-email.handler';
import { RentCallProjection } from './projections/rent-call.projection.js';
import { AccountEntryProjection } from './projections/account-entry.projection.js';
import { RentCallFinder } from './finders/rent-call.finder.js';
import { AccountEntryFinder } from './finders/account-entry.finder.js';
import { PaymentFinder } from './finders/payment.finder.js';
import { RentCallPdfAssembler } from './services/rent-call-pdf-assembler.service.js';
import { ReceiptPdfAssembler } from './services/receipt-pdf-assembler.service.js';
import { RentCallCalculationService } from '@billing/rent-call/rent-call-calculation.service';
import { RentCallAggregate } from '@billing/rent-call/rent-call.aggregate';

@Module({
  imports: [CqrsModule, CqrxModule.forFeature([RentCallAggregate]), EntityPresentationModule, LeasePresentationModule],
  controllers: [GenerateRentCallsForMonthController, GetRentCallsController, GetRentCallPdfController, GetReceiptPdfController, SendRentCallsByEmailController, RecordManualPaymentController, GetTenantAccountController, GetRentCallPaymentsController],
  providers: [
    GetRentCallsHandler,
    GenerateRentCallsForMonthHandler,
    SendRentCallsByEmailHandler,
    RentCallProjection,
    AccountEntryProjection,
    RentCallFinder,
    AccountEntryFinder,
    PaymentFinder,
    RentCallPdfAssembler,
    ReceiptPdfAssembler,
    RentCallCalculationService,
  ],
  exports: [RentCallFinder],
})
export class RentCallPresentationModule {}
