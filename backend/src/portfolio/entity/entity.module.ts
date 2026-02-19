import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityAggregate } from './entity.aggregate.js';
import { CreateAnEntityHandler } from './commands/create-an-entity.handler.js';
import { UpdateAnEntityHandler } from './commands/update-an-entity.handler.js';
import { AddABankAccountHandler } from './commands/add-a-bank-account.handler.js';
import { UpdateABankAccountHandler } from './commands/update-a-bank-account.handler.js';
import { RemoveABankAccountHandler } from './commands/remove-a-bank-account.handler.js';
import { ConfigureLatePaymentDelayHandler } from './commands/configure-late-payment-delay.handler.js';
import { LinkABankConnectionHandler } from './commands/link-a-bank-connection.handler.js';
import { DisconnectABankConnectionHandler } from './commands/disconnect-a-bank-connection.handler.js';
import { MarkBankConnectionExpiredHandler } from './commands/mark-bank-connection-expired.handler.js';
import { MarkBankConnectionSyncedHandler } from './commands/mark-bank-connection-synced.handler.js';

@Module({
  imports: [CqrxModule.forFeature([EntityAggregate])],
  providers: [
    CreateAnEntityHandler,
    UpdateAnEntityHandler,
    AddABankAccountHandler,
    UpdateABankAccountHandler,
    RemoveABankAccountHandler,
    ConfigureLatePaymentDelayHandler,
    LinkABankConnectionHandler,
    DisconnectABankConnectionHandler,
    MarkBankConnectionExpiredHandler,
    MarkBankConnectionSyncedHandler,
  ],
})
export class EntityDomainModule {}
