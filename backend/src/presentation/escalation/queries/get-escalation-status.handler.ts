import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { GetEscalationStatusQuery } from './get-escalation-status.query.js';
import type { EscalationStatusResponse } from './escalation-status-response.js';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';

@QueryHandler(GetEscalationStatusQuery)
export class GetEscalationStatusHandler implements IQueryHandler<GetEscalationStatusQuery> {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  async execute(query: GetEscalationStatusQuery): Promise<EscalationStatusResponse> {
    const entity = await this.entityFinder.findByIdAndUserId(query.entityId, query.userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const escalation = await this.escalationFinder.findByRentCallId(query.rentCallId, query.userId);

    if (!escalation) {
      return {
        rentCallId: query.rentCallId,
        tier1SentAt: null,
        tier1RecipientEmail: null,
        tier2SentAt: null,
        tier3SentAt: null,
      };
    }

    return {
      rentCallId: escalation.rentCallId,
      tier1SentAt: escalation.tier1SentAt?.toISOString() ?? null,
      tier1RecipientEmail: escalation.tier1RecipientEmail ?? null,
      tier2SentAt: escalation.tier2SentAt?.toISOString() ?? null,
      tier3SentAt: escalation.tier3SentAt?.toISOString() ?? null,
    };
  }
}
