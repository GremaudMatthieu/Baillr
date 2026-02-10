import { Module } from '@nestjs/common';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityAggregate } from './entity.aggregate.js';
import { CreateAnEntityHandler } from './commands/create-an-entity.handler.js';
import { UpdateAnEntityHandler } from './commands/update-an-entity.handler.js';
import { AddABankAccountHandler } from './commands/add-a-bank-account.handler.js';
import { UpdateABankAccountHandler } from './commands/update-a-bank-account.handler.js';
import { RemoveABankAccountHandler } from './commands/remove-a-bank-account.handler.js';

@Module({
  imports: [CqrxModule.forFeature([EntityAggregate])],
  providers: [
    CreateAnEntityHandler,
    UpdateAnEntityHandler,
    AddABankAccountHandler,
    UpdateABankAccountHandler,
    RemoveABankAccountHandler,
  ],
})
export class EntityDomainModule {}
