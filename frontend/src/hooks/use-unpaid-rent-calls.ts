"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useRentCallsApi,
  type UnpaidRentCallData,
} from "@/lib/api/rent-calls-api";

export function useUnpaidRentCalls(entityId: string | undefined) {
  const api = useRentCallsApi();
  return useQuery<UnpaidRentCallData[]>({
    queryKey: ["entities", entityId, "rent-calls", "unpaid"],
    queryFn: () => api.getUnpaidRentCalls(entityId!),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}
