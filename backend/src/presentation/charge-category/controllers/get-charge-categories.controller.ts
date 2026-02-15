import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import type { ChargeCategory } from '@prisma/client';
import { GetChargeCategoriesQuery } from '../queries/get-charge-categories.query.js';

@Controller('entities/:entityId/charge-categories')
export class GetChargeCategoriesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: ChargeCategory[] }> {
    const data = await this.queryBus.execute<GetChargeCategoriesQuery, ChargeCategory[]>(
      new GetChargeCategoriesQuery(entityId, userId),
    );
    return { data };
  }
}
