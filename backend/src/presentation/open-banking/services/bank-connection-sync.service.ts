import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import type { BankConnection } from '@prisma/client';
import { BridgeService, type BridgeTransaction } from '@infrastructure/open-banking/bridge.service';
import { ImportABankStatementCommand } from '@billing/bank-statement/commands/import-a-bank-statement.command';
import { MarkBankConnectionSyncedCommand } from '@portfolio/entity/commands/mark-bank-connection-synced.command';
import type { ParsedTransaction } from '@infrastructure/bank-import/parsed-transaction.interface';
import { buildExistingKeySet, buildTransactionKey, markDuplicates } from '@infrastructure/bank-import/transaction-dedup.util';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class BankConnectionSyncService {
  private readonly logger = new Logger(BankConnectionSyncService.name);

  constructor(
    private readonly bridge: BridgeService,
    private readonly commandBus: CommandBus,
    private readonly prisma: PrismaService,
  ) {}

  async syncConnection(
    connection: BankConnection,
    userId: string,
    options?: { since?: string; until?: string },
  ): Promise<{ imported: number }> {
    const rawAccountIds = connection.accountIds;
    if (!Array.isArray(rawAccountIds) || !rawAccountIds.every((id) => typeof id === 'string')) {
      this.logger.warn(`Invalid accountIds for connection ${connection.id}, skipping sync`);
      return { imported: 0 };
    }
    const accountIds = rawAccountIds as string[];
    let totalImported = 0;

    const since =
      options?.since ??
      (connection.lastSyncedAt
        ? connection.lastSyncedAt.toISOString().split('T')[0]
        : undefined);
    const until = options?.until;

    // Load existing transactions for cross-sync dedup
    const existingTransactions = await this.prisma.bankTransaction.findMany({
      where: { entityId: connection.entityId },
      select: { date: true, amountCents: true, reference: true },
    });
    const existingKeys = buildExistingKeySet(existingTransactions);

    for (const accountId of accountIds) {
      try {
        const bridgeAccountId = parseInt(accountId, 10);
        if (isNaN(bridgeAccountId)) continue;

        const transactions = await this.bridge.getTransactions(bridgeAccountId, connection.entityId, since, until);
        const parsed = this.mapTransactions(transactions);

        markDuplicates(parsed, existingKeys);

        // Only import non-duplicate transactions
        const newTransactions = parsed.filter((t) => !t.isDuplicate);
        if (newTransactions.length === 0) continue;

        const bankStatementId = randomUUID();
        const fileName = `open-banking-sync-${new Date().toISOString().split('T')[0]}`;

        await this.commandBus.execute(
          new ImportABankStatementCommand(
            bankStatementId,
            connection.entityId,
            userId,
            connection.bankAccountId,
            fileName,
            newTransactions,
          ),
        );

        // Add newly imported keys to the set for cross-account dedup within same sync
        for (const t of newTransactions) {
          existingKeys.add(buildTransactionKey(t.date, t.amountCents, t.reference));
        }

        totalImported += newTransactions.length;
      } catch (error) {
        this.logger.error(
          `Failed to sync account ${accountId} for connection ${connection.id}: ${(error as Error).message}`,
        );
      }
    }

    // Mark connection as synced
    const now = new Date().toISOString();
    await this.commandBus.execute(
      new MarkBankConnectionSyncedCommand(connection.entityId, connection.id, now),
    );

    this.logger.log(
      `Synced connection ${connection.id}: ${totalImported} transactions imported`,
    );

    return { imported: totalImported };
  }

  mapTransactions(bridgeTransactions: BridgeTransaction[]): ParsedTransaction[] {
    return bridgeTransactions.map((tx) => {
      const amountCents = Math.round(tx.amount * 100);
      const payerName = tx.clean_description || 'Inconnu';
      const reference = tx.provider_description || tx.clean_description || String(tx.id);
      const date = tx.booking_date ?? tx.date;

      return {
        date: new Date(date).toISOString(),
        amountCents,
        payerName,
        reference,
        rawLine: {
          transactionId: String(tx.id),
          bookingDate: date,
          amount: String(tx.amount),
          currency: tx.currency_code,
        },
      };
    });
  }
}
