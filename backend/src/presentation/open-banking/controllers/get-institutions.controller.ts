import { Controller, Get, Param, ParseUUIDPipe, Query, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { BridgeService } from '@infrastructure/open-banking/bridge.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';

@Controller('entities/:entityId/open-banking')
export class GetInstitutionsController {
  constructor(
    private readonly bridge: BridgeService,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get('institutions')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Query('country') country: string = 'fr',
  ): Promise<{ data: unknown[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const banks = await this.bridge.getBanks(country);
    return { data: banks };
  }
}
