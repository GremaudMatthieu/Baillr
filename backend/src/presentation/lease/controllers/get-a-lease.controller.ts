import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Lease } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetALeaseQuery } from '../queries/get-a-lease.query.js';

@Controller('leases')
export class GetALeaseController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Lease }> {
    const lease: Lease = await this.queryBus.execute(new GetALeaseQuery(id, userId));
    return { data: lease };
  }
}
