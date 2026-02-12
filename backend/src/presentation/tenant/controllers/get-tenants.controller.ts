import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Tenant } from '@prisma/client';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { GetTenantsQuery } from '../queries/get-tenants.query.js';

@Controller('entities/:entityId/tenants')
export class GetTenantsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
  ): Promise<{ data: Tenant[] }> {
    const tenants: Tenant[] = await this.queryBus.execute(
      new GetTenantsQuery(entityId, userId),
    );
    return { data: tenants };
  }
}
