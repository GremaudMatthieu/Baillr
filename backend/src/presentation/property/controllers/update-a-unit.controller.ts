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
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { UpdateAUnitDto } from '../dto/update-a-unit.dto.js';
import { UpdateAUnitCommand } from '@portfolio/property/unit/commands/update-a-unit.command.js';
import { UnitFinder } from '../finders/unit.finder.js';

@Controller('units')
export class UpdateAUnitController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly unitFinder: UnitFinder,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAUnitDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const unit = await this.unitFinder.findByIdAndUser(id, userId);
    if (!unit) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new UpdateAUnitCommand(
        id,
        userId,
        dto.identifier,
        dto.type,
        dto.floor,
        dto.surfaceArea,
        dto.billableOptions,
      ),
    );
  }
}
