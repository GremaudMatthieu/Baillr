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
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { RecordWaterMeterReadingsDto } from '../dto/record-water-meter-readings.dto.js';
import { RecordWaterMeterReadingsCommand } from '@indexation/water-meter-readings/commands/record-water-meter-readings.command';

@Controller('entities/:entityId/water-meter-readings')
export class RecordWaterMeterReadingsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: RecordWaterMeterReadingsDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new RecordWaterMeterReadingsCommand(dto.id, entityId, userId, dto.fiscalYear, dto.readings),
    );
  }
}
