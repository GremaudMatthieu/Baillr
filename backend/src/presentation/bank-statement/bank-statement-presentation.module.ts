import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { BankStatementAggregate } from '@billing/bank-statement/bank-statement.aggregate';
import { RentCallAggregate } from '@billing/rent-call/rent-call.aggregate';
import { PaymentMatchingModule } from '@billing/payment-matching/payment-matching.module';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { RentCallPresentationModule } from '../rent-call/rent-call-presentation.module.js';
import { ImportABankStatementController } from './controllers/import-a-bank-statement.controller.js';
import { GetBankStatementsController } from './controllers/get-bank-statements.controller.js';
import { GetBankTransactionsController } from './controllers/get-bank-transactions.controller.js';
import { MatchPaymentsController } from './controllers/match-payments.controller.js';
import { ValidateAMatchController } from './controllers/validate-a-match.controller.js';
import { RejectAMatchController } from './controllers/reject-a-match.controller.js';
import { ManualAssignAMatchController } from './controllers/manual-assign-a-match.controller.js';
import { ImportABankStatementHandler } from '@billing/bank-statement/commands/import-a-bank-statement.handler';
import { RecordAPaymentHandler } from '@billing/rent-call/commands/record-a-payment.handler';
import { GetBankStatementsHandler } from './queries/get-bank-statements.handler.js';
import { GetBankTransactionsHandler } from './queries/get-bank-transactions.handler.js';
import { BankStatementProjection } from './projections/bank-statement.projection.js';
import { BankStatementFinder } from './finders/bank-statement.finder.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([BankStatementAggregate, RentCallAggregate]),
    EntityPresentationModule,
    RentCallPresentationModule,
    PaymentMatchingModule,
  ],
  controllers: [
    ImportABankStatementController,
    GetBankStatementsController,
    GetBankTransactionsController,
    MatchPaymentsController,
    ValidateAMatchController,
    RejectAMatchController,
    ManualAssignAMatchController,
  ],
  providers: [
    ImportABankStatementHandler,
    RecordAPaymentHandler,
    GetBankStatementsHandler,
    GetBankTransactionsHandler,
    BankStatementProjection,
    BankStatementFinder,
  ],
  exports: [BankStatementFinder],
})
export class BankStatementPresentationModule {}
