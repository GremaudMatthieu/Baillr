import { Event } from 'nestjs-cqrx';

export interface BankStatementImportedData {
  bankStatementId: string;
  entityId: string;
  userId: string;
  bankAccountId: string;
  fileName: string;
  transactionCount: number;
  transactions: Array<{
    date: string;
    amountCents: number;
    payerName: string;
    reference: string;
    isDuplicate?: boolean;
  }>;
  importedAt: string; // ISO
}

export class BankStatementImported extends Event<BankStatementImportedData> {
  constructor(data: BankStatementImportedData) {
    super(data);
  }
}
