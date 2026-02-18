import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetRentCallsQuery } from './get-rent-calls.query.js';
import { RentCallFinder, type RentCallWithTenant } from '../finders/rent-call.finder.js';

@QueryHandler(GetRentCallsQuery)
export class GetRentCallsHandler implements IQueryHandler<GetRentCallsQuery> {
  constructor(private readonly rentCallFinder: RentCallFinder) {}

  async execute(query: GetRentCallsQuery): Promise<RentCallWithTenant[]> {
    return this.rentCallFinder.findAllByEntityAndUser(query.entityId, query.userId, query.month);
  }
}
