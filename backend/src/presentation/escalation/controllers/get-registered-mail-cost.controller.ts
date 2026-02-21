import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { Ar24Service } from '@infrastructure/registered-mail/ar24.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';

@Controller('entities/:entityId/escalation')
export class GetRegisteredMailCostController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly ar24: Ar24Service,
  ) {}

  @Get('registered-mail/cost')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ costCentsHt: number; costCentsTtc: number }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.ar24.getCost();
  }
}
