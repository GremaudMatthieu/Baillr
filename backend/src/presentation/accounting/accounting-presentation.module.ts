import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { GetAccountBookController } from './controllers/get-account-book.controller.js';
import { GetAccountBookHandler } from './queries/get-account-book.handler.js';
import { AccountingFinder } from './finders/accounting.finder.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [GetAccountBookController],
  providers: [GetAccountBookHandler, AccountingFinder],
})
export class AccountingPresentationModule {}
