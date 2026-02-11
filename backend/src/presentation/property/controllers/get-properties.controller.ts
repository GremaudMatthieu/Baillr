import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Property } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetPropertiesQuery } from '../queries/get-properties.query.js';

@Controller('entities/:entityId/properties')
export class GetPropertiesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Property[] }> {
    const properties: Property[] = await this.queryBus.execute(
      new GetPropertiesQuery(entityId, userId),
    );
    return { data: properties };
  }
}
