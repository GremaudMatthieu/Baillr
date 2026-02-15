import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { ChargeCategoryPresentationModule } from '../charge-category/charge-category-presentation.module.js';
import { TenantPresentationModule } from '../tenant/tenant-presentation.module.js';
import { PropertyPresentationModule } from '../property/property-presentation.module.js';
import { CreateALeaseController } from './controllers/create-a-lease.controller.js';
import { ConfigureLeaseBillingLinesController } from './controllers/configure-lease-billing-lines.controller.js';
import { ConfigureLeaseRevisionParametersController } from './controllers/configure-lease-revision-parameters.controller.js';
import { TerminateALeaseController } from './controllers/terminate-a-lease.controller.js';
import { GetLeasesController } from './controllers/get-leases.controller.js';
import { GetALeaseController } from './controllers/get-a-lease.controller.js';
import { GetLeasesHandler } from './queries/get-leases.handler.js';
import { GetALeaseHandler } from './queries/get-a-lease.handler.js';
import { LeaseProjection } from './projections/lease.projection.js';
import { RevisionApprovedReaction } from './reactions/revision-approved.reaction.js';
import { LeaseFinder } from './finders/lease.finder.js';

@Module({
  imports: [
    CqrsModule,
    EntityPresentationModule,
    TenantPresentationModule,
    PropertyPresentationModule,
    ChargeCategoryPresentationModule,
  ],
  controllers: [
    CreateALeaseController,
    ConfigureLeaseBillingLinesController,
    ConfigureLeaseRevisionParametersController,
    TerminateALeaseController,
    GetLeasesController,
    GetALeaseController,
  ],
  providers: [
    GetLeasesHandler,
    GetALeaseHandler,
    LeaseProjection,
    RevisionApprovedReaction,
    LeaseFinder,
  ],
  exports: [LeaseFinder],
})
export class LeasePresentationModule {}
