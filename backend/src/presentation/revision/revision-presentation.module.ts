import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { InseeIndexPresentationModule } from '../insee-index/insee-index-presentation.module.js';
import { RevisionAggregate } from '@indexation/revision/revision.aggregate';
import { CalculateARevisionHandler } from '@indexation/revision/commands/calculate-a-revision.handler';
import { CalculateRevisionsController } from './controllers/calculate-revisions.controller.js';
import { GetRevisionsController } from './controllers/get-revisions.controller.js';
import { RevisionProjection } from './projections/revision.projection.js';
import { RevisionFinder } from './finders/revision.finder.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([RevisionAggregate]),
    EntityPresentationModule,
    LeasePresentationModule,
    InseeIndexPresentationModule,
  ],
  controllers: [CalculateRevisionsController, GetRevisionsController],
  providers: [
    CalculateARevisionHandler,
    RevisionProjection,
    RevisionFinder,
  ],
  exports: [RevisionFinder],
})
export class RevisionPresentationModule {}
