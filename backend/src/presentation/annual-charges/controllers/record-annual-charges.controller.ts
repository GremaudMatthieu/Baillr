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
import { RecordAnnualChargesDto } from '../dto/record-annual-charges.dto.js';
import { RecordAnnualChargesCommand } from '@indexation/annual-charges/commands/record-annual-charges.command';

@Controller('entities/:entityId/annual-charges')
export class RecordAnnualChargesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: RecordAnnualChargesDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new RecordAnnualChargesCommand(dto.id, entityId, userId, dto.fiscalYear, dto.charges),
    );
  }
}
