import { Controller, Get, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { GetUnpaidRentCallsQuery } from '../queries/get-unpaid-rent-calls.query.js';
import type { UnpaidRentCallResult } from '../finders/unpaid-rent-call.finder.js';

@Controller('entities/:entityId/rent-calls')
export class GetUnpaidRentCallsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get('unpaid')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: UnpaidRentCallResult[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.queryBus.execute<GetUnpaidRentCallsQuery, UnpaidRentCallResult[]>(
      new GetUnpaidRentCallsQuery(entityId, userId),
    );

    return { data };
  }
}
