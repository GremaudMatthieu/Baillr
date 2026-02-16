"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useAccountingApi,
  type AccountingFilters,
} from "@/lib/api/accounting-api";

export function useAccountBook(
  entityId: string | undefined,
  filters?: AccountingFilters,
) {
  const api = useAccountingApi();
  return useQuery({
    queryKey: ["entities", entityId, "accounting", filters],
    queryFn: () => api.getAccountBook(entityId!, filters),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}
