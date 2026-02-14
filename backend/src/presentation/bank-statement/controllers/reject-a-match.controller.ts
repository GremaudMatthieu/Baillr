import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RejectMatchDto } from '../dto/reject-match.dto.js';

@Controller('entities/:entityId/payment-matches')
export class RejectAMatchController {
  constructor(private readonly entityFinder: EntityFinder) {}

  @Post('reject')
  @HttpCode(HttpStatus.OK)
  async handle(
    @CurrentUser() userId: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() _dto: RejectMatchDto,
  ): Promise<{ status: string }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    // Rejection is UI-only (no domain event). The transaction is simply
    // excluded from matching results on next run. See Dev Notes: YAGNI.
    return { status: 'rejected' };
  }
}
