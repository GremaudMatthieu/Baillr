import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { RentCall } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { GetRentCallsQuery } from '../queries/get-rent-calls.query.js';

@Controller('entities/:entityId/rent-calls')
export class GetRentCallsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() userId: string,
  ): Promise<{ data: RentCall[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.queryBus.execute<GetRentCallsQuery, RentCall[]>(
      new GetRentCallsQuery(entityId, userId, month),
    );

    return { data };
  }
}
