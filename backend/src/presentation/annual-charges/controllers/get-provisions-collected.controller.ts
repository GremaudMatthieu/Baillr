import { Controller, Get, Param, Query, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetProvisionsCollectedQuery } from '../queries/get-provisions-collected.query.js';
import type { ProvisionsResponse } from '../queries/get-provisions-collected.handler.js';

@Controller('entities/:entityId/provisions')
export class GetProvisionsCollectedController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('fiscalYear') fiscalYearStr: string | undefined,
    @CurrentUser() userId: string,
  ) {
    if (!fiscalYearStr) {
      throw new BadRequestException('fiscalYear query parameter is required');
    }

    const fiscalYear = parseInt(fiscalYearStr, 10);
    if (isNaN(fiscalYear)) {
      throw new BadRequestException('fiscalYear must be a valid integer');
    }

    const data = await this.queryBus.execute<GetProvisionsCollectedQuery, ProvisionsResponse>(
      new GetProvisionsCollectedQuery(entityId, fiscalYear, userId),
    );
    return { data };
  }
}
