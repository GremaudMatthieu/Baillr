import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { EscalationFinder } from '../finders/escalation.finder.js';

interface EscalationStatusResponse {
  rentCallId: string;
  tier1SentAt: string | null;
  tier1RecipientEmail: string | null;
  tier2SentAt: string | null;
  tier3SentAt: string | null;
}

@Controller('entities/:entityId/escalations')
export class GetBatchEscalationStatusController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  @Get('batch')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('rentCallIds') rentCallIdsParam: string,
    @CurrentUser() userId: string,
  ): Promise<EscalationStatusResponse[]> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    if (!rentCallIdsParam) {
      return [];
    }

    const rentCallIds = rentCallIdsParam.split(',').filter(Boolean);
    if (rentCallIds.length === 0) {
      return [];
    }

    const escalations = await this.escalationFinder.findAllByRentCallIds(rentCallIds, userId);

    const escalationMap = new Map(escalations.map((e) => [e.rentCallId, e]));

    return rentCallIds.map((rentCallId) => {
      const escalation = escalationMap.get(rentCallId);
      if (!escalation) {
        return {
          rentCallId,
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
    });
  }
}
