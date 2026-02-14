import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
  NotFoundException,
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

@Controller('entities/:entityId/rent-calls/:rentCallId/escalation')
export class GetEscalationStatusController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly escalationFinder: EscalationFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('rentCallId', ParseUUIDPipe) rentCallId: string,
    @CurrentUser() userId: string,
  ): Promise<EscalationStatusResponse> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const escalation = await this.escalationFinder.findByRentCallId(rentCallId, userId);

    // Return null state if no escalation exists yet (all tiers available)
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
  }
}
