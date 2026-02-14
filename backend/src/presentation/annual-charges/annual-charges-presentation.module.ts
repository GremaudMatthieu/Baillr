import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { AnnualChargesAggregate } from '@indexation/annual-charges/annual-charges.aggregate';
import { RecordAnnualChargesHandler } from '@indexation/annual-charges/commands/record-annual-charges.handler';
import { RecordAnnualChargesController } from './controllers/record-annual-charges.controller.js';
import { GetAnnualChargesController } from './controllers/get-annual-charges.controller.js';
import { GetProvisionsCollectedController } from './controllers/get-provisions-collected.controller.js';
import { AnnualChargesProjection } from './projections/annual-charges.projection.js';
import { AnnualChargesFinder } from './finders/annual-charges.finder.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([AnnualChargesAggregate]),
    EntityPresentationModule,
  ],
  controllers: [
    RecordAnnualChargesController,
    GetAnnualChargesController,
    GetProvisionsCollectedController,
  ],
  providers: [
    RecordAnnualChargesHandler,
    AnnualChargesProjection,
    AnnualChargesFinder,
  ],
  exports: [AnnualChargesFinder],
})
export class AnnualChargesPresentationModule {}
