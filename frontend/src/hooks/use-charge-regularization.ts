"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useChargeRegularizationApi,
  type CalculateChargeRegularizationPayload,
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
