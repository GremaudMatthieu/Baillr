import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { InseeIndexFinder } from '../finders/insee-index.finder.js';
import { RecordAnInseeIndexDto } from '../dto/record-an-insee-index.dto.js';
import { RecordAnInseeIndexCommand } from '@indexation/insee-index/commands/record-an-insee-index.command';

@Controller('entities/:entityId/insee-indices')
export class RecordAnInseeIndexController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly inseeIndexFinder: InseeIndexFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: RecordAnInseeIndexDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const [entity, duplicateExists] = await Promise.all([
      this.entityFinder.findByIdAndUserId(entityId, userId),
      this.inseeIndexFinder.existsByTypeQuarterYearEntity(
        dto.type,
        dto.quarter,
        dto.year,
        entityId,
      ),
    ]);

    if (!entity) {
      throw new UnauthorizedException();
    }

    if (duplicateExists) {
      throw new ConflictException(
        `Un indice ${dto.type} pour ${dto.quarter} ${dto.year} existe déjà`,
      );
    }

    await this.commandBus.execute(
      new RecordAnInseeIndexCommand(
        dto.id,
        dto.type,
        dto.quarter,
        dto.year,
        dto.value,
        entityId,
        userId,
      ),
    );
  }
}
