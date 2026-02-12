"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useLeasesApi,
  type CreateLeasePayload,
  type BillingLineData,
  type ConfigureRevisionParametersPayload,
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
        billingLines: [],
        revisionDay: null,
        revisionMonth: null,
        referenceQuarter: null,
        referenceYear: null,
        baseIndexValue: null,
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

export function useConfigureBillingLines(leaseId: string, entityId: string) {
  const api = useLeasesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (billingLines: BillingLineData[]) =>
      api.configureBillingLines(leaseId, { billingLines }),
    onMutate: async (billingLines) => {
      const detailKey = ["leases", leaseId];
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<LeaseData>(detailKey);

      if (previous) {
        queryClient.setQueryData<LeaseData>(detailKey, {
          ...previous,
          billingLines,
        });
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["leases", leaseId], context.previous);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["leases", leaseId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "leases"],
        });
      }, 1500);
    },
  });
}

export function useConfigureRevisionParameters(
  leaseId: string,
  entityId: string,
) {
  const api = useLeasesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfigureRevisionParametersPayload) =>
      api.configureRevisionParameters(leaseId, payload),
    onMutate: async (payload) => {
      const detailKey = ["leases", leaseId];
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<LeaseData>(detailKey);

      if (previous) {
        queryClient.setQueryData<LeaseData>(detailKey, {
          ...previous,
          revisionDay: payload.revisionDay,
          revisionMonth: payload.revisionMonth,
          referenceQuarter: payload.referenceQuarter,
          referenceYear: payload.referenceYear,
          baseIndexValue: payload.baseIndexValue ?? null,
        });
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["leases", leaseId], context.previous);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["leases", leaseId],
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
