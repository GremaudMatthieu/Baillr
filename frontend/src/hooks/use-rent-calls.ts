"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useRentCallsApi,
  type RentCallData,
  type GenerationResult,
} from "@/lib/api/rent-calls-api";

export type { RentCallData, GenerationResult };

export function useRentCalls(entityId: string, month?: string) {
  const api = useRentCallsApi();
  return useQuery({
    queryKey: ["entities", entityId, "rent-calls", month ?? "all"],
    queryFn: () => api.getRentCalls(entityId, month),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useGenerateRentCalls(entityId: string) {
  const api = useRentCallsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (month: string) => api.generateRentCalls(entityId, month),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "leases"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities"],
        });
      }, 1500);
    },
  });
}
