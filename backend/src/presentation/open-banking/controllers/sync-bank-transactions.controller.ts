import {
  Controller,
  Post,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { BankConnectionFinder } from '../finders/bank-connection.finder.js';
import { BankConnectionSyncService } from '../services/bank-connection-sync.service.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

@Controller('entities/:entityId/bank-connections/:connectionId')
export class SyncBankTransactionsController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly bankConnectionFinder: BankConnectionFinder,
    private readonly syncService: BankConnectionSyncService,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser() userId: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
  ): Promise<{ imported: number }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    if (since && !DATE_REGEX.test(since)) {
      throw new BadRequestException('since must be in YYYY-MM-DD format');
    }
    if (until && !DATE_REGEX.test(until)) {
      throw new BadRequestException('until must be in YYYY-MM-DD format');
    }

    const connection = await this.bankConnectionFinder.findById(connectionId);
    if (!connection || connection.entityId !== entityId) {
      throw new NotFoundException('Bank connection not found');
    }

    if (connection.status !== 'linked') {
      throw new NotFoundException('Bank connection is not active');
    }

    return this.syncService.syncConnection(connection, userId, {
      ...(since ? { since } : {}),
      ...(until ? { until } : {}),
    });
  }
}
