import { Controller, Get, Param, Query, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import type { InseeIndex } from '@prisma/client';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetInseeIndicesQuery } from '../queries/get-insee-indices.query.js';

const VALID_INDEX_TYPES = ['IRL', 'ILC', 'ICC'];

@Controller('entities/:entityId/insee-indices')
export class GetInseeIndicesController {
  constructor(private readonly queryBus: QueryBus) {}

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

    const data = await this.queryBus.execute<GetInseeIndicesQuery, InseeIndex[]>(
      new GetInseeIndicesQuery(entityId, userId, type),
    );

    return { data };
  }
}
