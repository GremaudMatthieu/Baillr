import type { ParsedTransaction } from '@infrastructure/bank-import/parsed-transaction.interface.js';

export class ImportABankStatementCommand {
  public constructor(
    public readonly id: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly bankAccountId: string,
    public readonly fileName: string,
    public readonly transactions: ParsedTransaction[],
  ) {}
}
