import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { CreateAnEntityDto } from '../dto/create-an-entity.dto.js';
import { CreateAnEntityCommand } from '@portfolio/entity/commands/create-an-entity.command';

@Controller('entities')
export class CreateAnEntityController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async handle(@Body() dto: CreateAnEntityDto, @CurrentUser() userId: string): Promise<void> {
    await this.commandBus.execute(
      new CreateAnEntityCommand(
        dto.id,
        userId,
        dto.type,
        dto.name,
        dto.email,
        dto.siret ?? null,
        { ...dto.address, complement: dto.address.complement ?? null },
        dto.legalInformation ?? null,
      ),
    );
  }
}
