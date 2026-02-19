import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { GetTreasuryChartDto } from '../dto/get-treasury-chart.dto.js';
import { GetTreasuryChartQuery } from '../queries/get-treasury-chart.query.js';
import type { TreasuryMonthData } from '../finders/treasury-chart.finder.js';

@Controller('entities/:entityId')
export class GetTreasuryChartController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get('treasury-chart')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() dto: GetTreasuryChartDto,
    @CurrentUser() userId: string,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.queryBus.execute<GetTreasuryChartQuery, TreasuryMonthData[]>(
      new GetTreasuryChartQuery(entityId, userId, dto.months),
    );

    return { data };
  }
}
