"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAnnualChargesApi,
  type RecordAnnualChargesPayload,
  type AnnualChargesData,
  type ProvisionsData,
} from "@/lib/api/annual-charges-api";

export function useAnnualCharges(entityId: string, fiscalYear?: number) {
  const api = useAnnualChargesApi();
  return useQuery({
    queryKey: ["entities", entityId, "annual-charges", fiscalYear ?? "all"],
    queryFn: () => api.getAnnualCharges(entityId, fiscalYear),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useRecordAnnualCharges(entityId: string) {
  const api = useAnnualChargesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordAnnualChargesPayload) =>
      api.recordAnnualCharges(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = [
        "entities",
        entityId,
        "annual-charges",
        payload.fiscalYear,
      ];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<AnnualChargesData | null>(queryKey);

      const optimistic: AnnualChargesData = {
        id: payload.id,
        entityId,
        userId: "",
        fiscalYear: payload.fiscalYear,
        charges: payload.charges,
        totalAmountCents: payload.charges.reduce(
          (sum, c) => sum + c.amountCents,
          0,
        ),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<AnnualChargesData | null>(
        queryKey,
        optimistic,
      );

      return { previous, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: (_data, _error, payload) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "annual-charges",
            payload.fiscalYear,
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "annual-charges", "all"],
        });
      }, 1500);
    },
  });
}

export function useProvisionsCollected(
  entityId: string,
  fiscalYear?: number,
) {
  const api = useAnnualChargesApi();
  return useQuery({
    queryKey: ["entities", entityId, "provisions", fiscalYear],
    queryFn: () => api.getProvisionsCollected(entityId, fiscalYear!),
    enabled: !!entityId && !!fiscalYear,
    staleTime: 30_000,
  });
}
