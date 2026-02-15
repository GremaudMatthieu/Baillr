import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { ChargeRegularization } from '@prisma/client';
import { GetChargeRegularizationQuery } from './get-charge-regularization.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ChargeRegularizationFinder } from '../finders/charge-regularization.finder.js';

@QueryHandler(GetChargeRegularizationQuery)
export class GetChargeRegularizationHandler
  implements IQueryHandler<GetChargeRegularizationQuery>
{
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly chargeRegularizationFinder: ChargeRegularizationFinder,
  ) {}

  async execute(
    query: GetChargeRegularizationQuery,
  ): Promise<ChargeRegularization | ChargeRegularization[] | null> {
    const entity = await this.entityFinder.findByIdAndUserId(
      query.entityId,
      query.userId,
    );
    if (!entity) {
      throw new UnauthorizedException();
    }

    if (query.fiscalYear !== undefined) {
      return this.chargeRegularizationFinder.findByEntityAndYear(
        query.entityId,
        query.fiscalYear,
      );
    }

    return this.chargeRegularizationFinder.findAllByEntity(query.entityId);
  }
}
