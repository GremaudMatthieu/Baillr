import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../../rent-call/finders/rent-call.finder.js';
import { ManualAssignMatchDto } from '../dto/manual-assign-match.dto.js';
import { RecordAPaymentCommand } from '@billing/rent-call/commands/record-a-payment.command';

@Controller('entities/:entityId/payment-matches')
export class ManualAssignAMatchController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
  ) {}

  @Post('assign')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @CurrentUser() userId: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: ManualAssignMatchDto,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const rentCall = await this.rentCallFinder.findByIdAndEntity(dto.rentCallId, entityId, userId);
    if (!rentCall) throw new NotFoundException('Rent call not found');

    await this.commandBus.execute(
      new RecordAPaymentCommand(
        dto.rentCallId,
        entityId,
        userId,
        dto.transactionId,
        dto.bankStatementId ?? null,
        dto.amountCents,
        dto.payerName,
        dto.paymentDate,
      ),
    );
  }
}
