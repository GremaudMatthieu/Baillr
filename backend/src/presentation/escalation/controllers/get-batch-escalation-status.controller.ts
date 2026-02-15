import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetBatchEscalationStatusQuery } from '../queries/get-batch-escalation-status.query.js';
import type { EscalationStatusResponse } from '../queries/escalation-status-response.js';

@Controller('entities/:entityId/escalations')
export class GetBatchEscalationStatusController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('batch')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('rentCallIds') rentCallIdsParam: string,
    @CurrentUser() userId: string,
  ) {
    if (!rentCallIdsParam) {
      return [];
    }

    const rentCallIds = rentCallIdsParam.split(',').filter(Boolean);
    if (rentCallIds.length === 0) {
      return [];
    }

    return await this.queryBus.execute<GetBatchEscalationStatusQuery, EscalationStatusResponse[]>(
      new GetBatchEscalationStatusQuery(entityId, rentCallIds, userId),
    );
  }
}
