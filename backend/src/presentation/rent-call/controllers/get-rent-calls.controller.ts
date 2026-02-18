import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { GetRentCallsQuery } from '../queries/get-rent-calls.query.js';
import type { RentCallWithTenant } from '../finders/rent-call.finder.js';

@Controller('entities/:entityId/rent-calls')
export class GetRentCallsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query('month') month: string | undefined,
    @CurrentUser() userId: string,
  ) {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    const rentCalls = await this.queryBus.execute<GetRentCallsQuery, RentCallWithTenant[]>(
      new GetRentCallsQuery(entityId, userId, month),
    );

    const data = rentCalls.map(({ tenant, ...rest }) => ({
      ...rest,
      tenantFirstName: tenant.firstName,
      tenantLastName: tenant.lastName,
      tenantCompanyName: tenant.companyName,
      tenantType: tenant.type,
    }));

    return { data };
  }
}
