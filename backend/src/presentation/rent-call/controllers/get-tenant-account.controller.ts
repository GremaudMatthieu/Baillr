import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetTenantAccountQuery } from '../queries/get-tenant-account.query.js';

@Controller('entities/:entityId/tenants/:tenantId/account')
export class GetTenantAccountController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() userId: string,
  ) {
    return await this.queryBus.execute<
      GetTenantAccountQuery,
      { entries: unknown[]; balanceCents: number }
    >(new GetTenantAccountQuery(entityId, tenantId, userId));
  }
}
