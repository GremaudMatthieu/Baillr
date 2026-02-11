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
import { CreateAUnitDto } from '../dto/create-a-unit.dto.js';
import { CreateAUnitCommand } from '@portfolio/property/unit/commands/create-a-unit.command.js';
import { PropertyFinder } from '../finders/property.finder.js';

@Controller('properties/:propertyId/units')
export class CreateAUnitController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly propertyFinder: PropertyFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateAUnitDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const property = await this.propertyFinder.findByIdAndUser(propertyId, userId);
    if (!property) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new CreateAUnitCommand(
        dto.id,
        userId,
        propertyId,
        dto.identifier,
        dto.type,
        dto.floor ?? null,
        dto.surfaceArea,
        dto.billableOptions ?? [],
      ),
    );
  }
}
