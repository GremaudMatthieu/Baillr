"use client";

import { useQuery } from "@tanstack/react-query";
import {
  useAccountEntriesApi,
  type AccountEntryData,
} from "@/lib/api/account-entries-api";

export function useTenantAccount(entityId: string, tenantId: string) {
  const api = useAccountEntriesApi();

  return useQuery<{ entries: AccountEntryData[]; balanceCents: number }>({
    queryKey: ["entities", entityId, "tenants", tenantId, "account"],
    queryFn: () => api.getTenantAccount(entityId, tenantId),
    enabled: !!entityId && !!tenantId,
    staleTime: 30_000,
  });
}
