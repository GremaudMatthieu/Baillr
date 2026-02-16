import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { AccountingFinder } from '../finders/accounting.finder.js';
import { AccountBookExcelAssembler } from '../assemblers/account-book-excel.assembler.js';
import { ExcelGeneratorService } from '@infrastructure/document/excel-generator.service.js';
import { ExportAccountBookQuery } from './export-account-book.query.js';

export interface ExportAccountBookResult {
  buffer: Buffer;
  filename: string;
}

@QueryHandler(ExportAccountBookQuery)
export class ExportAccountBookHandler
  implements IQueryHandler<ExportAccountBookQuery>
{
  constructor(
    private readonly entityFinder: EntityFinder,
    private readonly accountingFinder: AccountingFinder,
    private readonly assembler: AccountBookExcelAssembler,
    private readonly excelGenerator: ExcelGeneratorService,
  ) {}

  async execute(query: ExportAccountBookQuery): Promise<ExportAccountBookResult> {
    const entity = await this.entityFinder.findByIdAndUserId(
      query.entityId,
      query.userId,
    );
    if (!entity) {
      throw new UnauthorizedException();
    }

    const entries = await this.accountingFinder.findByEntity(query.entityId, {
      startDate: query.startDate,
      endDate: query.endDate,
      category: query.category,
      tenantId: query.tenantId,
    });

    const excelData = this.assembler.assemble(entity, entries, {
      startDate: query.startDate,
      endDate: query.endDate,
    });

    const buffer = this.excelGenerator.generateAccountBookExcel(excelData);
    const filename = this.assembler.buildFilename(entity.name);

    return { buffer, filename };
  }
}
