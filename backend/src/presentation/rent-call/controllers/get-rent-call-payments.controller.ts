import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Payment } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetRentCallPaymentsQuery } from '../queries/get-rent-call-payments.query.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/payments')
export class GetRentCallPaymentsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ) {
    return await this.queryBus.execute<GetRentCallPaymentsQuery, Payment[]>(
      new GetRentCallPaymentsQuery(entityId, rentCallId, userId),
    );
  }
}
