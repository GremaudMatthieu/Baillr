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
import { TreasuryChartFinder } from '../finders/treasury-chart.finder.js';
import { GetTreasuryChartDto } from '../dto/get-treasury-chart.dto.js';

@Controller('entities/:entityId')
export class GetTreasuryChartController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly treasuryChartFinder: TreasuryChartFinder,
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

    const data = await this.treasuryChartFinder.getChartData(
      entityId,
      userId,
      dto.months,
    );

    return { data };
  }
}
