"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useChargeRegularizationApi,
  type CalculateChargeRegularizationPayload,
  type SendChargeRegularizationResult,
} from "@/lib/api/charge-regularization-api";

export function useChargeRegularization(
  entityId: string,
  fiscalYear?: number,
) {
  const api = useChargeRegularizationApi();
  return useQuery({
    queryKey: [
      "entities",
      entityId,
      "charge-regularization",
      fiscalYear,
    ],
    queryFn: () => api.getChargeRegularization(entityId, fiscalYear!),
    enabled: !!entityId && !!fiscalYear,
    staleTime: 30_000,
  });
}

export function useChargeRegularizations(entityId: string | undefined) {
  const api = useChargeRegularizationApi();
  return useQuery({
    queryKey: ["entities", entityId, "charge-regularizations"],
    queryFn: () => api.getChargeRegularizations(entityId!),
    enabled: !!entityId,
    staleTime: 60_000,
  });
}

export function useCalculateChargeRegularization(entityId: string) {
  const api = useChargeRegularizationApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CalculateChargeRegularizationPayload) =>
      api.calculateChargeRegularization(entityId, payload),
    onSettled: (_data, _error, payload) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "charge-regularization",
            payload.fiscalYear,
          ],
        });
      }, 1500);
    },
  });
}

export function useApplyChargeRegularization(
  entityId: string,
  fiscalYear: number,
) {
  const api = useChargeRegularizationApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.applyChargeRegularization(entityId, fiscalYear),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "charge-regularization",
            fiscalYear,
          ],
        });
        // Also invalidate all tenant account queries for this entity
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "tenants"],
        });
      }, 1500);
    },
  });
}

export function useSendChargeRegularization(
  entityId: string,
  fiscalYear: number,
) {
  const api = useChargeRegularizationApi();
  const queryClient = useQueryClient();
  return useMutation<SendChargeRegularizationResult>({
    mutationFn: () => api.sendChargeRegularization(entityId, fiscalYear),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "charge-regularization",
            fiscalYear,
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "charge-regularizations"],
        });
      }, 1500);
    },
  });
}

export function useSettleChargeRegularization(
  entityId: string,
  fiscalYear: number,
) {
  const api = useChargeRegularizationApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.settleChargeRegularization(entityId, fiscalYear),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "charge-regularization",
            fiscalYear,
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "charge-regularizations"],
        });
      }, 1500);
    },
  });
}
