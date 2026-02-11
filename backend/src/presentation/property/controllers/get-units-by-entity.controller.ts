import { Controller, Get, Param, ParseUUIDPipe, UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { GetUnitsByEntityQuery } from '../queries/get-units-by-entity.query.js';
import type { UnitWithPropertyName } from '../queries/get-units-by-entity.handler.js';

@Controller('entities/:entityId/units')
export class GetUnitsByEntityController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: UnitWithPropertyName[] }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const units: UnitWithPropertyName[] = await this.queryBus.execute(
      new GetUnitsByEntityQuery(entityId, userId),
    );
    return { data: units };
  }
}
