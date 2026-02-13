import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import {
  SendRentCallsByEmailCommand,
  type SendResult,
} from '@billing/rent-call/commands/send-rent-calls-by-email.command';
import { SendRentCallsDto } from '../dto/send-rent-calls.dto.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RentCallFinder } from '../finders/rent-call.finder.js';

@Controller('entities/:entityId/rent-calls')
export class SendRentCallsByEmailController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly rentCallFinder: RentCallFinder,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: SendRentCallsDto,
    @CurrentUser() userId: string,
  ): Promise<SendResult> {
    // Entity ownership + load unsent rent calls (parallel)
    const [entity, unsentRentCalls] = await Promise.all([
      this.entityFinder.findByIdAndUserId(entityId, userId),
      this.rentCallFinder.findUnsentByEntityAndMonth(entityId, userId, dto.month),
    ]);

    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.commandBus.execute<SendRentCallsByEmailCommand, SendResult>(
      new SendRentCallsByEmailCommand(entityId, dto.month, userId, unsentRentCalls),
    );
  }
}
