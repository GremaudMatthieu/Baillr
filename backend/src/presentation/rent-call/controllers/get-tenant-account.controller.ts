import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AccountEntryFinder } from '../finders/account-entry.finder.js';

@Controller('entities/:entityId/tenants/:tenantId/account')
export class GetTenantAccountController {
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly accountEntryFinder: AccountEntryFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() userId: string,
  ): Promise<{ entries: unknown[]; balanceCents: number }> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const entries = await this.accountEntryFinder.findByTenantAndEntity(tenantId, entityId);
    const { balanceCents } = await this.accountEntryFinder.getBalance(tenantId, entityId);

    return { entries, balanceCents };
  }
}
