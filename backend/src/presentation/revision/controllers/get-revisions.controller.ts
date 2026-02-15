import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import type { Revision } from '@prisma/client';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetRevisionsQuery } from '../queries/get-revisions.query.js';

@Controller('entities/:entityId/revisions')
export class GetRevisionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Revision[] }> {
    const data = await this.queryBus.execute<GetRevisionsQuery, Revision[]>(
      new GetRevisionsQuery(entityId, userId),
    );
    return { data };
  }
}
