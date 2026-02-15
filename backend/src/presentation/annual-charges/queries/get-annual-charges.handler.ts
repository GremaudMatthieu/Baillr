import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import type { AnnualCharges } from '@prisma/client';
import { GetAnnualChargesQuery } from './get-annual-charges.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AnnualChargesFinder } from '../finders/annual-charges.finder.js';

@QueryHandler(GetAnnualChargesQuery)
export class GetAnnualChargesHandler implements IQueryHandler<GetAnnualChargesQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly annualChargesFinder: AnnualChargesFinder,
  ) {}

  async execute(query: GetAnnualChargesQuery): Promise<AnnualCharges | AnnualCharges[] | null> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    if (query.fiscalYear !== undefined) {
      return this.annualChargesFinder.findByEntityAndYear(query.entityId, query.fiscalYear);
    }

    return this.annualChargesFinder.findAllByEntity(query.entityId);
  }
}
