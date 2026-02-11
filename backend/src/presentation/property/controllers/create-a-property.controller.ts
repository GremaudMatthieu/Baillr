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
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { CreateAPropertyDto } from '../dto/create-a-property.dto.js';
import { CreateAPropertyCommand } from '@portfolio/property/commands/create-a-property.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';

@Controller('entities/:entityId/properties')
export class CreateAPropertyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: CreateAPropertyDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new CreateAPropertyCommand(dto.id, userId, entityId, dto.name, dto.type ?? null, {
        ...dto.address,
        country: dto.address.country ?? 'France',
        complement: dto.address.complement ?? null,
      }),
    );
  }
}
