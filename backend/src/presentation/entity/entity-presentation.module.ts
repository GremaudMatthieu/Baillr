import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateAnEntityController } from './controllers/create-an-entity.controller.js';
import { UpdateAnEntityController } from './controllers/update-an-entity.controller.js';
import { GetEntitiesController } from './controllers/get-entities.controller.js';
import { GetAnEntityController } from './controllers/get-an-entity.controller.js';
import { AddABankAccountController } from './controllers/add-a-bank-account.controller.js';
import { UpdateABankAccountController } from './controllers/update-a-bank-account.controller.js';
import { RemoveABankAccountController } from './controllers/remove-a-bank-account.controller.js';
import { GetBankAccountsController } from './controllers/get-bank-accounts.controller.js';
import { GetEntitiesHandler } from './queries/get-entities.handler.js';
import { GetAnEntityHandler } from './queries/get-an-entity.handler.js';
import { GetBankAccountsHandler } from './queries/get-bank-accounts.handler.js';
import { EntityProjection } from './projections/entity.projection.js';
import { EntityFinder } from './finders/entity.finder.js';

@Module({
  imports: [CqrsModule],
  controllers: [
    CreateAnEntityController,
    UpdateAnEntityController,
    GetEntitiesController,
    GetAnEntityController,
    AddABankAccountController,
    UpdateABankAccountController,
    RemoveABankAccountController,
    GetBankAccountsController,
  ],
  providers: [
    GetEntitiesHandler,
    GetAnEntityHandler,
    GetBankAccountsHandler,
    EntityProjection,
    EntityFinder,
  ],
})
export class EntityPresentationModule {}
