"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useInseeIndicesApi,
  type RecordInseeIndexPayload,
  type InseeIndexData,
  type FetchInseeIndicesResult,
} from "@/lib/api/insee-indices-api";

export function useInseeIndices(entityId: string) {
  const api = useInseeIndicesApi();
  return useQuery({
    queryKey: ["entities", entityId, "insee-indices"],
    queryFn: () => api.getInseeIndices(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useRecordInseeIndex(entityId: string) {
  const api = useInseeIndicesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordInseeIndexPayload) =>
      api.recordInseeIndex(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "insee-indices"];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InseeIndexData[]>(queryKey);

      const optimistic: InseeIndexData = {
        id: payload.id,
        type: payload.type,
        quarter: payload.quarter,
        year: payload.year,
        value: payload.value,
        entityId,
        userId: "",
        source: "manual",
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<InseeIndexData[]>(queryKey, (old) => [
        ...(old || []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "insee-indices"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "insee-indices"],
        });
      }, 1500);
    },
  });
}

export function useFetchInseeIndices(entityId: string) {
  const api = useInseeIndicesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.fetchInseeIndices(entityId),
    onSuccess: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "insee-indices"],
        });
      }, 1500);
    },
  });
}
