import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetBatchEscalationStatusQuery } from './get-batch-escalation-status.query.js';
import type { EscalationStatusResponse } from './escalation-status-response.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';

@QueryHandler(GetBatchEscalationStatusQuery)
export class GetBatchEscalationStatusHandler implements IQueryHandler<GetBatchEscalationStatusQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  async execute(query: GetBatchEscalationStatusQuery): Promise<EscalationStatusResponse[]> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    if (query.rentCallIds.length === 0) {
      return [];
    }

    const escalations = await this.escalationFinder.findAllByRentCallIds(
      query.rentCallIds,
      query.userId,
    );

    const escalationMap = new Map(escalations.map((e) => [e.rentCallId, e]));

    return query.rentCallIds.map((rentCallId) => {
      const escalation = escalationMap.get(rentCallId);
      if (!escalation) {
        return {
          rentCallId,
          tier1SentAt: null,
          tier1RecipientEmail: null,
          tier2SentAt: null,
          tier3SentAt: null,
          registeredMailTrackingId: null,
          registeredMailProvider: null,
          registeredMailCostCents: null,
          registeredMailDispatchedAt: null,
          registeredMailStatus: null,
          registeredMailProofUrl: null,
        };
      }
      return {
        rentCallId: escalation.rentCallId,
        tier1SentAt: escalation.tier1SentAt?.toISOString() ?? null,
        tier1RecipientEmail: escalation.tier1RecipientEmail ?? null,
        tier2SentAt: escalation.tier2SentAt?.toISOString() ?? null,
        tier3SentAt: escalation.tier3SentAt?.toISOString() ?? null,
        registeredMailTrackingId: escalation.registeredMailTrackingId ?? null,
        registeredMailProvider: escalation.registeredMailProvider ?? null,
        registeredMailCostCents: escalation.registeredMailCostCents ?? null,
        registeredMailDispatchedAt: escalation.registeredMailDispatchedAt?.toISOString() ?? null,
        registeredMailStatus: escalation.registeredMailStatus ?? null,
        registeredMailProofUrl: escalation.registeredMailProofUrl ?? null,
      };
    });
  }
}
