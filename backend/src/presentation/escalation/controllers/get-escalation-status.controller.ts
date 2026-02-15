import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetEscalationStatusQuery } from '../queries/get-escalation-status.query.js';
import type { EscalationStatusResponse } from '../queries/escalation-status-response.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class GetEscalationStatusController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ) {
    return await this.queryBus.execute<GetEscalationStatusQuery, EscalationStatusResponse>(
      new GetEscalationStatusQuery(entityId, rentCallId, userId),
    );
  }
}
