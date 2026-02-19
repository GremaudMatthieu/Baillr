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
import { GetDashboardKpisDto } from '../dto/get-dashboard-kpis.dto.js';
import { GetDashboardKpisQuery } from '../queries/get-dashboard-kpis.query.js';
import type { DashboardKpisResult } from '../finders/dashboard-kpis.finder.js';

@Controller('entities/:entityId')
export class GetDashboardKpisController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get('dashboard-kpis')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() dto: GetDashboardKpisDto,
    @CurrentUser() userId: string,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.queryBus.execute<GetDashboardKpisQuery, DashboardKpisResult>(
      new GetDashboardKpisQuery(entityId, userId, dto.month),
    );
  }
}
