import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import { randomUUID } from 'crypto';
import type { BankStatementImportedData } from '@billing/bank-statement/events/bank-statement-imported.event';

@Injectable()
export class BankStatementProjection implements OnModuleInit {
  private readonly logger = new Logger(BankStatementProjection.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting bank statement projection subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['bank-statement_'] }),
    });

    subscription.on('data', ({ event }) => {
      if (!event) return;
      this.reconnectAttempts = 0;
      this.processingChain = this.processingChain.then(() =>
        this.handleEvent(event.type, event.data as Record<string, unknown>),
      );
    });

    subscription.on('error', (error: Error) => {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);
      this.logger.error(`Bank statement projection subscription error: ${error.message}`);
      this.logger.log(
        `Reconnecting bank statement projection in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleEvent(eventType: string, data: Record<string, unknown>): Promise<void> {
    try {
      switch (eventType) {
        case 'BankStatementImported':
          await this.onBankStatementImported(data as unknown as BankStatementImportedData);
          break;
        default:
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to project ${eventType} for bank statement ${data.bankStatementId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  private async onBankStatementImported(data: BankStatementImportedData): Promise<void> {
    const existing = await this.prisma.bankStatement.findUnique({
      where: { id: data.bankStatementId },
    });
    if (existing) {
      this.logger.warn(
        `BankStatement ${data.bankStatementId} already exists — skipping projection (idempotent)`,
      );
      return;
    }

    await this.prisma.bankStatement.create({
      data: {
        id: data.bankStatementId,
        entityId: data.entityId,
        userId: data.userId,
        bankAccountId: data.bankAccountId,
        fileName: data.fileName,
        transactionCount: data.transactionCount,
        importedAt: new Date(data.importedAt),
      },
    });

    if (data.transactions && data.transactions.length > 0) {
      await this.prisma.bankTransaction.createMany({
        data: data.transactions.map((t) => ({
          id: randomUUID(),
          bankStatementId: data.bankStatementId,
          entityId: data.entityId,
          date: new Date(t.date),
          amountCents: t.amountCents,
          payerName: t.payerName,
          reference: t.reference,
          isDuplicate: t.isDuplicate ?? false,
        })),
      });
    }

    this.logger.log(
      `Projected BankStatementImported for ${data.bankStatementId} (${data.transactionCount} transactions)`,
    );
  }
}
