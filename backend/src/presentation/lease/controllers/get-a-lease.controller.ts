import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetALeaseQuery } from '../queries/get-a-lease.query.js';
import type { LeaseResponse } from '../queries/get-a-lease.handler.js';

@Controller('leases')
export class GetALeaseController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() userId: string) {
    return await this.queryBus.execute<GetALeaseQuery, LeaseResponse>(
      new GetALeaseQuery(id, userId),
    );
  }
}
