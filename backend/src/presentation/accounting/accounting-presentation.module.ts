import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { GetAccountBookController } from './controllers/get-account-book.controller.js';
import { ExportAccountBookController } from './controllers/export-account-book.controller.js';
import { GetAccountBookHandler } from './queries/get-account-book.handler.js';
import { ExportAccountBookHandler } from './queries/export-account-book.handler.js';
import { AccountingFinder } from './finders/accounting.finder.js';
import { AccountBookExcelAssembler } from './assemblers/account-book-excel.assembler.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [GetAccountBookController, ExportAccountBookController],
  providers: [
    GetAccountBookHandler,
    ExportAccountBookHandler,
    AccountingFinder,
    AccountBookExcelAssembler,
  ],
})
export class AccountingPresentationModule {}
