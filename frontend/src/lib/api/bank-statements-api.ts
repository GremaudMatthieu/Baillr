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
  payerName: string | null;
  reference: string | null;
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

export type ConfidenceLevel = "high" | "medium" | "low";

export interface MatchProposal {
  transactionId: string;
  rentCallId: string;
  confidence: ConfidenceLevel;
  score: number;
  transaction: {
    id: string;
    date: string;
    amountCents: number;
    payerName: string | null;
    reference: string | null;
  };
  rentCall: {
    id: string;
    tenantFirstName: string | null;
    tenantLastName: string | null;
    companyName: string | null;
    unitIdentifier: string;
    leaseId: string;
    totalAmountCents: number;
    month: string;
  };
}

export interface AmbiguousMatch {
  transactionId: string;
  confidence: ConfidenceLevel;
  score: number;
  transaction: {
    id: string;
    date: string;
    amountCents: number;
    payerName: string | null;
    reference: string | null;
  };
  candidates: Array<{
    rentCallId: string;
    score: number;
    confidence: ConfidenceLevel;
    rentCall: MatchProposal["rentCall"];
  }>;
}

export interface UnmatchedTransaction {
  transactionId: string;
  transaction: {
    id: string;
    date: string;
    amountCents: number;
    payerName: string | null;
    reference: string | null;
  };
}

export interface MatchingSummary {
  matched: number;
  unmatched: number;
  ambiguous: number;
  rentCallCount: number;
}

export interface MatchingResult {
  matches: MatchProposal[];
  ambiguous: AmbiguousMatch[];
  unmatched: UnmatchedTransaction[];
  summary: MatchingSummary;
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

    async matchPayments(
      entityId: string,
      bankStatementId: string,
      month: string,
    ): Promise<MatchingResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-statements/${bankStatementId}/match?month=${month}`,
        getToken,
        { method: "POST" },
      );
      return (await res.json()) as MatchingResult;
    },
  };
}
