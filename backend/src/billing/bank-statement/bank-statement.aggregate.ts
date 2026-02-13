import { AggregateRoot, EventHandler } from 'nestjs-cqrx';
import { BankStatementImported } from './events/bank-statement-imported.event.js';

export class BankStatementAggregate extends AggregateRoot {
  private bankStatementId!: string;
  private entityId!: string;
  private userId!: string;
  private bankAccountId!: string;
  private transactionCount!: number;
  private importedAt!: string;
  private created = false;

  static readonly streamName = 'bank-statement';

  import(
    entityId: string,
    userId: string,
    bankAccountId: string,
    fileName: string,
    transactions: Array<{
      date: string;
      amountCents: number;
      payerName: string;
      reference: string;
      isDuplicate?: boolean;
    }>,
    importedAt: Date,
  ): void {
    if (this.created) {
      return; // no-op guard for replays
    }

    this.apply(
      new BankStatementImported({
        bankStatementId: this.id,
        entityId,
        userId,
        bankAccountId,
        fileName,
        transactionCount: transactions.length,
        transactions,
        importedAt: importedAt.toISOString(),
      }),
    );
  }

  @EventHandler(BankStatementImported)
  onBankStatementImported(event: BankStatementImported): void {
    this.bankStatementId = event.data.bankStatementId;
    this.entityId = event.data.entityId;
    this.userId = event.data.userId;
    this.bankAccountId = event.data.bankAccountId;
    this.transactionCount = event.data.transactionCount;
    this.importedAt = event.data.importedAt;
    this.created = true;
  }
}
