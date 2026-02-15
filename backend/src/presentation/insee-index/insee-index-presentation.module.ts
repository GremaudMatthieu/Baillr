import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CqrxModule } from 'nestjs-cqrx';
import { EntityPresentationModule } from '../entity/entity-presentation.module.js';
import { InseeIndexAggregate } from '@indexation/insee-index/insee-index.aggregate';
import { RecordAnInseeIndexHandler } from '@indexation/insee-index/commands/record-an-insee-index.handler';
import { RecordAnInseeIndexController } from './controllers/record-an-insee-index.controller.js';
import { GetInseeIndicesController } from './controllers/get-insee-indices.controller.js';
import { GetInseeIndicesHandler } from './queries/get-insee-indices.handler.js';
import { InseeIndexProjection } from './projections/insee-index.projection.js';
import { InseeIndexFinder } from './finders/insee-index.finder.js';

@Module({
  imports: [CqrsModule, CqrxModule.forFeature([InseeIndexAggregate]), EntityPresentationModule],
  controllers: [RecordAnInseeIndexController, GetInseeIndicesController],
  providers: [
    RecordAnInseeIndexHandler,
    GetInseeIndicesHandler,
    InseeIndexProjection,
    InseeIndexFinder,
  ],
  exports: [InseeIndexFinder],
})
export class InseeIndexPresentationModule {}
