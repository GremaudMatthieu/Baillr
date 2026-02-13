import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { BankStatementAggregate } from '@billing/bank-statement/bank-statement.aggregate';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { ImportABankStatementController } from './controllers/import-a-bank-statement.controller.js';
import { GetBankStatementsController } from './controllers/get-bank-statements.controller.js';
import { GetBankTransactionsController } from './controllers/get-bank-transactions.controller.js';
import { ImportABankStatementHandler } from '@billing/bank-statement/commands/import-a-bank-statement.handler';
import { BankStatementProjection } from './projections/bank-statement.projection.js';
import { BankStatementFinder } from './finders/bank-statement.finder.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([BankStatementAggregate]),
    EntityPresentationModule,
  ],
  controllers: [
    ImportABankStatementController,
    GetBankStatementsController,
    GetBankTransactionsController,
  ],
  providers: [
    ImportABankStatementHandler,
    BankStatementProjection,
    BankStatementFinder,
  ],
  exports: [BankStatementFinder],
})
export class BankStatementPresentationModule {}
