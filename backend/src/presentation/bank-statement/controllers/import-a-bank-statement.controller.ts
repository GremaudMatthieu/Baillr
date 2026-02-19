import {
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { BankStatementParserService } from '@infrastructure/bank-import/bank-statement-parser.service';
import type { ParsedTransaction } from '@infrastructure/bank-import/parsed-transaction.interface';
import type { ColumnMapping } from '@infrastructure/bank-import/column-mapping.interface';
import { DEFAULT_COLUMN_MAPPING } from '@infrastructure/bank-import/column-mapping.interface';
import { buildExistingKeySet, markDuplicates } from '@infrastructure/bank-import/transaction-dedup.util';
import { ImportABankStatementCommand } from '@billing/bank-statement/commands/import-a-bank-statement.command';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { EntityFinder } from '../../entity/finders/entity.finder.js';
import { ImportBankStatementDto } from '../dto/import-bank-statement.dto.js';

export interface ImportedTransactionResponse {
  date: string;
  amountCents: number;
  payerName: string;
  reference: string;
  isDuplicate?: boolean;
}

export interface ImportResult {
  bankStatementId: string;
  transactionCount: number;
  transactions: ImportedTransactionResponse[];
}

@Controller('entities/:entityId/bank-statements')
export class ImportABankStatementController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
    private readonly parser: BankStatementParserService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (_req, file, cb) => {
        const allowed = ['.csv', '.xlsx', '.xls'];
        const ext = extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
      },
    }),
  )
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportBankStatementDto,
    @CurrentUser() userId: string,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('Fichier requis (.csv, .xlsx, .xls uniquement)');
    }

    // Entity ownership check
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    // Parse column mapping from JSON string (sent as FormData field)
    let mapping: ColumnMapping = DEFAULT_COLUMN_MAPPING;
    if (dto.mapping) {
      try {
        mapping = { ...DEFAULT_COLUMN_MAPPING, ...JSON.parse(dto.mapping) };
      } catch {
        throw new BadRequestException('Invalid column mapping format');
      }
    }

    // Detect file type and parse
    const ext = extname(file.originalname).toLowerCase();
    let transactions: ParsedTransaction[];

    try {
      if (ext === '.csv') {
        transactions = this.parser.parseCsv(file.buffer, mapping);
      } else {
        transactions = this.parser.parseExcel(file.buffer, mapping);
      }
    } catch (error) {
      throw new BadRequestException(`Erreur de parsing: ${(error as Error).message}`);
    }

    // Cross-import duplicate detection: compare against existing transactions
    const existingTransactions = await this.prisma.bankTransaction.findMany({
      where: { entityId },
      select: { date: true, amountCents: true, reference: true },
    });
    const existingKeys = buildExistingKeySet(existingTransactions);
    markDuplicates(transactions, existingKeys);

    // Generate UUID and dispatch command
    const bankStatementId = randomUUID();

    await this.commandBus.execute(
      new ImportABankStatementCommand(
        bankStatementId,
        entityId,
        userId,
        dto.bankAccountId,
        file.originalname,
        transactions,
      ),
    );

    return {
      bankStatementId,
      transactionCount: transactions.length,
      transactions: transactions.map((t) => ({
        date: t.date,
        amountCents: t.amountCents,
        payerName: t.payerName,
        reference: t.reference,
        ...(t.isDuplicate ? { isDuplicate: true } : {}),
      })),
    };
  }
}
