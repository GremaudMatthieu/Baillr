import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Lease } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetLeasesQuery } from '../queries/get-leases.query.js';

@Controller('entities/:entityId/leases')
export class GetLeasesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Lease[] }> {
    const leases: Lease[] = await this.queryBus.execute(new GetLeasesQuery(entityId, userId));
    return { data: leases };
  }
}
