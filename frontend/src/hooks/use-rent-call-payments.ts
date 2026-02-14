"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useAccountEntriesApi,
  type PaymentData,
} from "@/lib/api/account-entries-api";

export function useRentCallPayments(
  entityId: string,
  rentCallId: string | null,
) {
  const api = useAccountEntriesApi();

  return useQuery<PaymentData[]>({
    queryKey: ["entities", entityId, "rent-calls", rentCallId, "payments"],
    queryFn: () => api.getRentCallPayments(entityId, rentCallId!),
    enabled: !!entityId && !!rentCallId,
    staleTime: 30_000,
  });
}
