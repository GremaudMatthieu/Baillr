import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Unit } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetAUnitQuery } from '../queries/get-a-unit.query.js';

@Controller('units')
export class GetAUnitController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Unit }> {
    const unit: Unit = await this.queryBus.execute(new GetAUnitQuery(id, userId));
    return { data: unit };
  }
}
