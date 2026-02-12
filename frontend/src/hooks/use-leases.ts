"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useLeasesApi,
  type CreateLeasePayload,
  type LeaseData,
} from "@/lib/api/leases-api";

export function useLeases(entityId: string) {
  const api = useLeasesApi();
  return useQuery({
    queryKey: ["entities", entityId, "leases"],
    queryFn: () => api.getLeases(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useLease(leaseId: string) {
  const api = useLeasesApi();
  return useQuery({
    queryKey: ["leases", leaseId],
    queryFn: () => api.getLease(leaseId),
    enabled: !!leaseId,
    staleTime: 30_000,
  });
}

export function useCreateLease(entityId: string) {
  const api = useLeasesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeasePayload) =>
      api.createLease(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "leases"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<LeaseData[]>(queryKey);

      const optimistic: LeaseData = {
        id: payload.id,
        entityId,
        userId: "",
        tenantId: payload.tenantId,
        unitId: payload.unitId,
        startDate: payload.startDate,
        rentAmountCents: payload.rentAmountCents,
        securityDepositCents: payload.securityDepositCents,
        monthlyDueDate: payload.monthlyDueDate,
        revisionIndexType: payload.revisionIndexType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<LeaseData[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "leases"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "leases"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "units"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities"],
        });
      }, 1500);
    },
  });
}
