"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRentCallsApi } from "@/lib/api/rent-calls-api";

export interface RecordManualPaymentData {
  amountCents: number;
  paymentMethod: "cash" | "check";
  paymentDate: string;
  payerName: string;
  paymentReference?: string;
}

export function useRecordManualPayment(entityId: string) {
  const api = useRentCallsApi();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordPayment = useCallback(
    async (
      rentCallId: string,
      data: RecordManualPaymentData,
    ): Promise<boolean> => {
      setIsPending(true);
      setError(null);
      try {
        await api.recordManualPayment(entityId, rentCallId, data);
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: ["entities", entityId, "rent-calls"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["entities"],
          });
        }, 1500);
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors de l'enregistrement du paiement";
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [entityId, api, queryClient],
  );

  return { recordPayment, isPending, error };
}
