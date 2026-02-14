import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { PaymentFinder } from '../finders/payment.finder.js';

@Controller('entities/:entityId/rent-calls/:rentCallId/payments')
export class GetRentCallPaymentsController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly paymentFinder: PaymentFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: unknown[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const data = await this.paymentFinder.findByRentCallId(rentCallId, entityId);

    return { data };
  }
}
