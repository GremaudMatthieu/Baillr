import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { GetOpenBankingStatusController } from './controllers/get-open-banking-status.controller.js';
import { GetInstitutionsController } from './controllers/get-institutions.controller.js';
import { InitiateBankConnectionController } from './controllers/initiate-bank-connection.controller.js';
import { CompleteBankConnectionController } from './controllers/complete-bank-connection.controller.js';
import { DisconnectBankConnectionController } from './controllers/disconnect-bank-connection.controller.js';
import { GetBankConnectionsController } from './controllers/get-bank-connections.controller.js';
import { SyncBankTransactionsController } from './controllers/sync-bank-transactions.controller.js';
import { BankConnectionFinder } from './finders/bank-connection.finder.js';
import { BankConnectionSyncService } from './services/bank-connection-sync.service.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [
    GetOpenBankingStatusController,
    GetInstitutionsController,
    InitiateBankConnectionController,
    CompleteBankConnectionController,
    DisconnectBankConnectionController,
    GetBankConnectionsController,
    SyncBankTransactionsController,
  ],
  providers: [BankConnectionFinder, BankConnectionSyncService],
  exports: [BankConnectionFinder, BankConnectionSyncService],
})
export class OpenBankingPresentationModule {}
