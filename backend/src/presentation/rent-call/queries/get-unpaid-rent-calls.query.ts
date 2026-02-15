import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  UnpaidRentCallFinder,
  type UnpaidRentCallResult,
} from '../finders/unpaid-rent-call.finder.js';

export class GetUnpaidRentCallsQuery {
  constructor(
    public readonly entityId: string,
    public readonly userId: string,
  ) {}
}

@QueryHandler(GetUnpaidRentCallsQuery)
export class GetUnpaidRentCallsHandler implements IQueryHandler<GetUnpaidRentCallsQuery> {
  constructor(private readonly finder: UnpaidRentCallFinder) {}

  async execute(query: GetUnpaidRentCallsQuery): Promise<UnpaidRentCallResult[]> {
    return this.finder.findAllByEntity(query.entityId, query.userId);
  }
}
