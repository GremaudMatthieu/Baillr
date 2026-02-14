import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { InseeIndex } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { InseeIndexFinder } from '../finders/insee-index.finder.js';

const VALID_INDEX_TYPES = ['IRL', 'ILC', 'ICC'];

@Controller('entities/:entityId/insee-indices')
export class GetInseeIndicesController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly inseeIndexFinder: InseeIndexFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('type') type: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: InseeIndex[] }> {
    if (type && !VALID_INDEX_TYPES.includes(type)) {
      throw new BadRequestException(
        `Invalid type: ${type}. Must be one of: ${VALID_INDEX_TYPES.join(', ')}`,
      );
    }

    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.inseeIndexFinder.findAllByEntity(entityId, type);

    return { data };
  }
}
