import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { UpdateAlertPreferencesDto } from '../dto/update-alert-preferences.dto.js';
import { GetAlertPreferencesQuery } from '../queries/get-alert-preferences.query.js';
import { UpdateAlertPreferencesCommand } from '../commands/update-alert-preferences.command.js';
import type { AlertPreferenceResult } from '../queries/get-alert-preferences.handler.js';
import type { AlertPreference } from '@prisma/client';

@Controller('entities/:entityId/alert-preferences')
export class AlertPreferenceController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get()
  async getPreferences(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const data = await this.queryBus.execute<GetAlertPreferencesQuery, AlertPreferenceResult[]>(
      new GetAlertPreferencesQuery(entityId, userId),
    );

    return { data };
  }

  @Put()
  async updatePreferences(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Body() dto: UpdateAlertPreferencesDto,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) throw new UnauthorizedException();

    const data = await this.commandBus.execute<UpdateAlertPreferencesCommand, AlertPreference[]>(
      new UpdateAlertPreferencesCommand(entityId, userId, dto.preferences),
    );

    return { data };
  }
}
