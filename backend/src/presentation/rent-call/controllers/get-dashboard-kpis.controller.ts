import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { DashboardKpisFinder } from '../finders/dashboard-kpis.finder.js';
import { GetDashboardKpisDto } from '../dto/get-dashboard-kpis.dto.js';

@Controller('entities/:entityId')
export class GetDashboardKpisController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly dashboardKpisFinder: DashboardKpisFinder,
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

    return this.dashboardKpisFinder.getKpis(entityId, userId, dto.month);
  }
}
