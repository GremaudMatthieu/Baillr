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
import { UpdateAPropertyDto } from '../dto/update-a-property.dto.js';
import { UpdateAPropertyCommand } from '@portfolio/property/commands/update-a-property.command';
import { PropertyFinder } from '../finders/property.finder.js';

@Controller('properties')
export class UpdateAPropertyController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly propertyFinder: PropertyFinder,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAPropertyDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const property = await this.propertyFinder.findByIdAndUser(id, userId);
    if (!property) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new UpdateAPropertyCommand(
        id,
        userId,
        dto.name,
        dto.type,
        dto.address
          ? {
              ...dto.address,
              country: dto.address.country ?? 'France',
              complement: dto.address.complement ?? null,
            }
          : undefined,
      ),
    );
  }
}
