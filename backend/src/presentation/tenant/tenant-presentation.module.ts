import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { RegisterATenantController } from './controllers/register-a-tenant.controller.js';
import { UpdateATenantController } from './controllers/update-a-tenant.controller.js';
import { GetTenantsController } from './controllers/get-tenants.controller.js';
import { GetATenantController } from './controllers/get-a-tenant.controller.js';
import { GetTenantsHandler } from './queries/get-tenants.handler.js';
import { GetATenantHandler } from './queries/get-a-tenant.handler.js';
import { TenantProjection } from './projections/tenant.projection.js';
import { TenantFinder } from './finders/tenant.finder.js';

@Module({
  imports: [CqrsModule, EntityPresentationModule],
  controllers: [
    RegisterATenantController,
    UpdateATenantController,
    GetTenantsController,
    GetATenantController,
  ],
  providers: [GetTenantsHandler, GetATenantHandler, TenantProjection, TenantFinder],
  exports: [TenantFinder],
})
export class TenantPresentationModule {}
