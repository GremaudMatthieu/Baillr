import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import type { Lease } from '@prisma/client';
import { GetALeaseQuery } from './get-a-lease.query.js';
import { LeaseFinder } from '../finders/lease.finder.js';

@QueryHandler(GetALeaseQuery)
export class GetALeaseHandler implements IQueryHandler<GetALeaseQuery> {
  constructor(private readonly finder: LeaseFinder) {}

  async execute(query: GetALeaseQuery): Promise<Lease> {
    const lease = await this.finder.findByIdAndUser(query.id, query.userId);
    if (!lease) {
      throw new NotFoundException('Lease not found');
    }
    return lease;
  }
}
