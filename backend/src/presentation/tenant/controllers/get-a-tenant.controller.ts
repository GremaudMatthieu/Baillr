import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Tenant } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetATenantQuery } from '../queries/get-a-tenant.query.js';

@Controller('tenants')
export class GetATenantController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get(':id')
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Tenant }> {
    const tenant: Tenant = await this.queryBus.execute(new GetATenantQuery(id, userId));
    return { data: tenant };
  }
}
