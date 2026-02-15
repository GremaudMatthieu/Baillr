import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import {
  SendChargeRegularizationCommand,
  type SendResult,
} from '@indexation/charge-regularization/commands/send-charge-regularization.command.js';

@Controller('entities/:entityId/charge-regularizations/:fiscalYear/send')
export class SendChargeRegularizationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('fiscalYear', ParseIntPipe) fiscalYear: number,
    @CurrentUser() userId: string,
  ): Promise<SendResult> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const id = `${entityId}-${fiscalYear}`;

    return this.commandBus.execute(
      new SendChargeRegularizationCommand(id, entityId, userId, fiscalYear),
    );
  }
}
