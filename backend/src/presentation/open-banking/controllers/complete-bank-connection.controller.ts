import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { BridgeService } from '@infrastructure/open-banking/bridge.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankConnectionFinder } from '../finders/bank-connection.finder.js';
import { LinkABankConnectionCommand } from '@portfolio/entity/commands/link-a-bank-connection.command';
import { randomUUID } from 'crypto';

@Controller('entities/:entityId/open-banking')
export class CompleteBankConnectionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly bridge: BridgeService,
    private readonly entityFinder: EntityFinder,
    private readonly bankConnectionFinder: BankConnectionFinder,
  ) {}

  @Get('callback')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Query('bankAccountId') bankAccountId: string,
  ): Promise<{ status: string; connectionId: string }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    if (!bankAccountId) throw new BadRequestException('Missing bankAccountId query parameter');

    // Idempotency guard — return existing connection if already linked
    const existing = await this.bankConnectionFinder.findByBankAccountId(bankAccountId);
    if (existing && existing.entityId === entityId) {
      return { status: 'linked', connectionId: existing.id };
    }

    // Query Bridge for items created for this entity
    const items = await this.bridge.getItems(entityId);

    // Find items not already linked in our system
    const existingConnections = await this.bankConnectionFinder.findByEntityId(entityId);
    const linkedItemIds = new Set(existingConnections.map((c) => c.requisitionId));
    const newItem = items.find((item) => !linkedItemIds.has(String(item.id)) && item.status === 0);

    if (!newItem) {
      throw new BadRequestException('No new bank connection found. Please try connecting again.');
    }

    // Resolve bank name
    let bankName = String(newItem.provider_id);
    try {
      const bank = await this.bridge.getBank(newItem.provider_id);
      bankName = bank.name;
    } catch {
      // Fallback to provider_id string
    }

    // Get accounts for this item
    const accounts = await this.bridge.getAccounts(newItem.id, entityId);
    const accountIds = accounts.map((a) => String(a.id));

    const connectionId = randomUUID();

    // SCA valid for 180 days from Bridge
    const expiry = newItem.authentication_expires_at
      ?? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    await this.commandBus.execute(
      new LinkABankConnectionCommand(
        entityId,
        userId,
        connectionId,
        bankAccountId,
        'bridge',
        String(newItem.provider_id),
        bankName,
        String(newItem.id),    // requisitionId field stores Bridge item ID
        '',                     // agreementId — not used by Bridge
        expiry,
        accountIds,
      ),
    );

    return { status: 'linked', connectionId };
  }
}
