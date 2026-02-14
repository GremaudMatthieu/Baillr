import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { BankStatementAggregate } from '@billing/bank-statement/bank-statement.aggregate';
import { PaymentMatchingModule } from '@billing/payment-matching/payment-matching.module';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { RentCallPresentationModule } from '../rent-call/rent-call-presentation.module.js';
import { ImportABankStatementController } from './controllers/import-a-bank-statement.controller.js';
import { GetBankStatementsController } from './controllers/get-bank-statements.controller.js';
import { GetBankTransactionsController } from './controllers/get-bank-transactions.controller.js';
import { MatchPaymentsController } from './controllers/match-payments.controller.js';
import { ImportABankStatementHandler } from '@billing/bank-statement/commands/import-a-bank-statement.handler';
import { BankStatementProjection } from './projections/bank-statement.projection.js';
import { BankStatementFinder } from './finders/bank-statement.finder.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([BankStatementAggregate]),
    EntityPresentationModule,
    RentCallPresentationModule,
    PaymentMatchingModule,
  ],
  controllers: [
    ImportABankStatementController,
    GetBankStatementsController,
    GetBankTransactionsController,
    MatchPaymentsController,
  ],
  providers: [
    ImportABankStatementHandler,
    BankStatementProjection,
    BankStatementFinder,
  ],
  exports: [BankStatementFinder],
})
export class BankStatementPresentationModule {}
