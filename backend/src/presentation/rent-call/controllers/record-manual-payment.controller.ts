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
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../finders/rent-call.finder.js';
import { RecordManualPaymentDto } from '../dto/record-manual-payment.dto.js';
import { RecordAPaymentCommand } from '@billing/rent-call/commands/record-a-payment.command';

@Controller('entities/:entityId/rent-calls/:rentCallId/payments')
export class RecordManualPaymentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
  ) {}

  @Post('manual')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @CurrentUser() userId: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @Body() dto: RecordManualPaymentDto,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const rentCall = await this.rentCallFinder.findByIdAndEntity(rentCallId, entityId, userId);
    if (!rentCall) throw new NotFoundException('Rent call not found');

    const transactionId = randomUUID();

    await this.commandBus.execute(
      new RecordAPaymentCommand(
        rentCallId,
        entityId,
        userId,
        transactionId,
        null, // bankStatementId = null for manual payments
        dto.amountCents,
        dto.payerName,
        dto.paymentDate,
        dto.paymentMethod,
        dto.paymentReference ?? null,
      ),
    );
  }
}
