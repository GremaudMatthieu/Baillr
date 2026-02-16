import { Controller, Get, Param, Query, Res, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { Response } from 'express';
import { CurrentUser } from '@infrastructure/auth/user.decorator.js';
import { ExportAccountBookQuery } from '../queries/export-account-book.query.js';
import { GetAccountBookQueryParamsDto } from '../dto/get-account-book-query-params.dto.js';
import type { ExportAccountBookResult } from '../queries/export-account-book.handler.js';

@Controller('entities/:entityId/accounting')
export class ExportAccountBookController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('export')
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentUser() userId: string,
    @Query() query: GetAccountBookQueryParamsDto,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.queryBus.execute<
      ExportAccountBookQuery,
      ExportAccountBookResult
    >(
      new ExportAccountBookQuery(
        entityId,
        userId,
        query.startDate,
        query.endDate,
        query.category,
        query.tenantId,
      ),
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.end(buffer);
  }
}
