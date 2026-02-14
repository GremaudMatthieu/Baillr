import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import type { Revision } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RevisionFinder } from '../finders/revision.finder.js';

@Controller('entities/:entityId/revisions')
export class GetRevisionsController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly revisionFinder: RevisionFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Revision[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.revisionFinder.findAllByEntity(entityId);
    return { data };
  }
}
