import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { GetRentCallPaymentsQuery } from './get-rent-call-payments.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { PaymentFinder } from '../finders/payment.finder.js';

@QueryHandler(GetRentCallPaymentsQuery)
export class GetRentCallPaymentsHandler implements IQueryHandler<GetRentCallPaymentsQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly paymentFinder: PaymentFinder,
  ) {}

  async execute(query: GetRentCallPaymentsQuery): Promise<Payment[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    return this.paymentFinder.findByRentCallId(query.rentCallId, query.entityId);
  }
}
