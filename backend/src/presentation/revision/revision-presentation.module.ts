import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { LeasePresentationModule } from '../lease/lease-presentation.module.js';
import { TenantPresentationModule } from '../tenant/tenant-presentation.module.js';
import { InseeIndexPresentationModule } from '../insee-index/insee-index-presentation.module.js';
import { RevisionAggregate } from '@indexation/revision/revision.aggregate';
import { CalculateARevisionHandler } from '@indexation/revision/commands/calculate-a-revision.handler';
import { ApproveRevisionsHandler } from '@indexation/revision/commands/approve-revisions.handler';
import { CalculateRevisionsController } from './controllers/calculate-revisions.controller.js';
import { GetRevisionsController } from './controllers/get-revisions.controller.js';
import { ApproveRevisionsController } from './controllers/approve-revisions.controller.js';
import { DownloadRevisionLetterController } from './controllers/download-revision-letter.controller.js';
import { GetRevisionsHandler } from './queries/get-revisions.handler.js';
import { RevisionProjection } from './projections/revision.projection.js';
import { RevisionFinder } from './finders/revision.finder.js';
import { RevisionLetterPdfAssembler } from './services/revision-letter-pdf-assembler.service.js';

@Module({
  imports: [
    CqrsModule,
    CqrxModule.forFeature([RevisionAggregate]),
    EntityPresentationModule,
    LeasePresentationModule,
    TenantPresentationModule,
    InseeIndexPresentationModule,
  ],
  controllers: [
    CalculateRevisionsController,
    GetRevisionsController,
    ApproveRevisionsController,
    DownloadRevisionLetterController,
  ],
  providers: [
    CalculateARevisionHandler,
    ApproveRevisionsHandler,
    GetRevisionsHandler,
    RevisionProjection,
    RevisionFinder,
    RevisionLetterPdfAssembler,
  ],
  exports: [RevisionFinder],
})
export class RevisionPresentationModule {}
