import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { BridgeService } from '@infrastructure/open-banking/bridge.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankConnectionFinder } from '../finders/bank-connection.finder.js';
import { DisconnectABankConnectionCommand } from '@portfolio/entity/commands/disconnect-a-bank-connection.command';

@Controller('entities/:entityId/bank-connections/:connectionId')
export class DisconnectBankConnectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly bridge: BridgeService,
    private readonly entityFinder: EntityFinder,
    private readonly bankConnectionFinder: BankConnectionFinder,
  ) {}

  @Delete()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const connection = await this.bankConnectionFinder.findById(connectionId);
    if (!connection || connection.entityId !== entityId) {
      throw new NotFoundException('Bank connection not found');
    }

    // Delete item from Bridge (best-effort)
    const itemId = parseInt(connection.requisitionId, 10);
    if (!isNaN(itemId)) {
      await this.bridge.deleteItem(itemId, entityId);
    }

    await this.commandBus.execute(
      new DisconnectABankConnectionCommand(entityId, userId, connectionId),
    );
  }
}
