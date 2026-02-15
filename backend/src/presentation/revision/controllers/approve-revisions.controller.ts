import {
  Controller,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ApproveRevisionsDto } from '../dto/approve-revisions.dto.js';
import { ApproveRevisionsCommand } from '@indexation/revision/commands/approve-revisions.command';

@Controller('entities/:entityId/revisions')
export class ApproveRevisionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post('approve')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: ApproveRevisionsDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(new ApproveRevisionsCommand(dto.revisionIds, entityId, userId));
  }
}
