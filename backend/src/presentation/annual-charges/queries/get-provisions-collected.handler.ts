import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetProvisionsCollectedQuery } from './get-provisions-collected.query.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AnnualChargesFinder } from '../finders/annual-charges.finder.js';

interface ProvisionDetail {
  chargeCategoryId: string | null;
  categoryLabel: string;
  totalCents: number;
}

export interface ProvisionsResponse {
  totalProvisionsCents: number;
  details: ProvisionDetail[];
}

@QueryHandler(GetProvisionsCollectedQuery)
export class GetProvisionsCollectedHandler implements IQueryHandler<GetProvisionsCollectedQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly annualChargesFinder: AnnualChargesFinder,
  ) {}

  async execute(query: GetProvisionsCollectedQuery): Promise<ProvisionsResponse> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const rentCalls = await this.annualChargesFinder.findPaidBillingLinesByEntityAndYear(
      query.entityId,
      query.fiscalYear,
    );

    const detailMap = new Map<
      string,
      { chargeCategoryId: string | null; categoryLabel: string; totalCents: number }
    >();

    for (const rc of rentCalls) {
      const lines = rc.billingLines as Array<{
        chargeCategoryId?: string | null;
        categoryLabel?: string;
        amountCents: number;
        label?: string;
        type?: string;
        category?: string | null;
      }>;
      if (!Array.isArray(lines)) continue;

      for (const line of lines) {
        if (line.chargeCategoryId) {
          const key = `cat:${line.chargeCategoryId}`;
          const existing = detailMap.get(key);
          if (existing) {
            existing.totalCents += line.amountCents;
          } else {
            detailMap.set(key, {
              chargeCategoryId: line.chargeCategoryId,
              categoryLabel: line.categoryLabel ?? 'Inconnu',
              totalCents: line.amountCents,
            });
          }
        } else if (line.type === 'provision') {
          const category = line.category ?? null;
          const key = category !== null ? `legacy-cat:${category}` : `legacy-label:${line.label}`;
          const existing = detailMap.get(key);
          if (existing) {
            existing.totalCents += line.amountCents;
          } else {
            detailMap.set(key, {
              chargeCategoryId: null,
              categoryLabel: line.label ?? 'Inconnu',
              totalCents: line.amountCents,
            });
          }
        }
      }
    }

    const details: ProvisionDetail[] = Array.from(detailMap.values());
    const totalProvisionsCents = details.reduce((sum, d) => sum + d.totalCents, 0);

    return { totalProvisionsCents, details };
  }
}
