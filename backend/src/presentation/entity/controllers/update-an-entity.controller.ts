import {
  Controller,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { UpdateAnEntityDto } from '../dto/update-an-entity.dto.js';
import { UpdateAnEntityCommand } from '@domain/entity/commands/update-an-entity.command';

@Controller('entities')
export class UpdateAnEntityController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnEntityDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }
    await this.commandBus.execute(
      new UpdateAnEntityCommand(
        id,
        userId,
        dto.name,
        dto.siret,
        dto.address ? { ...dto.address, complement: dto.address.complement ?? null } : undefined,
        dto.legalInformation,
      ),
    );
  }
}
