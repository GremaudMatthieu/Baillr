import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Property } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetAPropertyQuery } from '../queries/get-a-property.query.js';

@Controller('properties')
export class GetAPropertyController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Property }> {
    const property: Property = await this.queryBus.execute(new GetAPropertyQuery(id, userId));
    return { data: property };
  }
}
