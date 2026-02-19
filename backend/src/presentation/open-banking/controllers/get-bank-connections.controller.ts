import { Controller, Get, Logger, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankConnectionFinder } from '../finders/bank-connection.finder.js';
import { MarkBankConnectionExpiredCommand } from '@portfolio/entity/commands/mark-bank-connection-expired.command';

@Controller('entities/:entityId/bank-connections')
export class GetBankConnectionsController {
  private readonly logger = new Logger(GetBankConnectionsController.name);

  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankConnectionFinder: BankConnectionFinder,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: unknown[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const connections = await this.bankConnectionFinder.findByEntityId(entityId);

    // Mark expired connections on-demand (no cron)
    const now = new Date();
    for (const connection of connections) {
      if (
        connection.status === 'linked' &&
        connection.agreementExpiry &&
        new Date(connection.agreementExpiry) < now
      ) {
        try {
          await this.commandBus.execute(
            new MarkBankConnectionExpiredCommand(entityId, connection.id),
          );
          connection.status = 'expired';
        } catch (error) {
          this.logger.warn(
            `Failed to mark connection ${connection.id} as expired: ${(error as Error).message}`,
          );
        }
      }
    }

    return { data: connections };
  }
}
