"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useBankStatementsApi,
  type BankStatementData,
  type BankTransactionData,
  type ImportedTransaction,
  type ImportResult,
  type ColumnMapping,
} from "@/lib/api/bank-statements-api";

export type {
  BankStatementData,
  BankTransactionData,
  ImportedTransaction,
  ImportResult,
  ColumnMapping,
};

export function useBankStatements(entityId: string) {
  const api = useBankStatementsApi();
  return useQuery({
    queryKey: ["entities", entityId, "bank-statements"],
    queryFn: () => api.getBankStatements(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useBankTransactions(
  entityId: string,
  bankStatementId: string,
) {
  const api = useBankStatementsApi();
  return useQuery({
    queryKey: [
      "entities",
      entityId,
      "bank-statements",
      bankStatementId,
      "transactions",
    ],
    queryFn: () => api.getBankTransactions(entityId, bankStatementId),
    enabled: !!entityId && !!bankStatementId,
    staleTime: 30_000,
  });
}

export function useImportBankStatement(entityId: string) {
  const api = useBankStatementsApi();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importStatement = useCallback(
    async (
      file: File,
      bankAccountId: string,
      mapping?: ColumnMapping,
    ): Promise<ImportResult | null> => {
      setIsPending(true);
      setError(null);
      try {
        const result = await api.importBankStatement(
          entityId,
          file,
          bankAccountId,
          mapping,
        );
        // Invalidate queries after successful import
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: ["entities", entityId, "bank-statements"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["entities"],
          });
        }, 1500);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de l'import";
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [entityId, api, queryClient],
  );

  return { importStatement, isPending, error };
}
