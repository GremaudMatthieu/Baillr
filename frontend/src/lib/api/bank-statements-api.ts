import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface BankStatementData {
  id: string;
  bankAccountId: string;
  fileName: string;
  transactionCount: number;
  importedAt: string;
}

export interface BankTransactionData {
  id: string;
  bankStatementId: string;
  date: string;
  amountCents: number;
  payerName: string;
  reference: string;
}

export interface ImportedTransaction {
  date: string;
  amountCents: number;
  payerName: string;
  reference: string;
  isDuplicate?: boolean;
}

export interface ColumnMapping {
  dateColumn: string;
  amountColumn: string;
  payerColumn: string;
  referenceColumn: string;
  dateFormat?: string;
  amountFormat?: "european" | "standard";
  skipHeaderRows?: number;
  debitColumn?: string;
  creditColumn?: string;
}

export interface ImportResult {
  bankStatementId: string;
  transactionCount: number;
  transactions: ImportedTransaction[];
}

export function useBankStatementsApi() {
  const { getToken } = useAuth();

  return {
    async importBankStatement(
      entityId: string,
      file: File,
      bankAccountId: string,
      mapping?: ColumnMapping,
    ): Promise<ImportResult> {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankAccountId", bankAccountId);
      if (mapping) {
        formData.append("mapping", JSON.stringify(mapping));
      }

      const response = await fetchWithAuth(
        `/entities/${entityId}/bank-statements/import`,
        getToken,
        {
          method: "POST",
          body: formData,
        },
      );

      return (await response.json()) as ImportResult;
    },

    async getBankStatements(entityId: string): Promise<BankStatementData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-statements`,
        getToken,
      );
      return (await res.json()) as BankStatementData[];
    },

    async getBankTransactions(
      entityId: string,
      bankStatementId: string,
    ): Promise<BankTransactionData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-statements/${bankStatementId}/transactions`,
        getToken,
      );
      return (await res.json()) as BankTransactionData[];
    },
  };
}
