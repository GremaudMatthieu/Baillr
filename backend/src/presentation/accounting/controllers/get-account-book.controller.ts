import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { GetAccountBookQuery } from '../queries/get-account-book.query.js';
import { GetAccountBookQueryParamsDto } from '../dto/get-account-book-query-params.dto.js';
import type { AccountBookResult } from '../queries/get-account-book.handler.js';

@Controller('entities/:entityId/accounting')
export class GetAccountBookController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Query() query: GetAccountBookQueryParamsDto,
  ): Promise<{ data: AccountBookResult }> {
    const data = await this.queryBus.execute<
      GetAccountBookQuery,
      AccountBookResult
    >(
      new GetAccountBookQuery(
        entityId,
        userId,
        query.startDate,
        query.endDate,
        query.category,
        query.tenantId,
      ),
    );
    return { data };
  }
}
