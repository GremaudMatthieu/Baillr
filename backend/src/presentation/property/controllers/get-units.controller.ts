import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Unit } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetUnitsQuery } from '../queries/get-units.query.js';

@Controller('properties/:propertyId/units')
export class GetUnitsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Unit[] }> {
    const units: Unit[] = await this.queryBus.execute(new GetUnitsQuery(propertyId, userId));
    return { data: units };
  }
}
