"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useWaterMeterApi,
  type RecordWaterMeterReadingsPayload,
  type WaterMeterReadingsData,
} from "@/lib/api/water-meter-api";

export function useWaterMeterReadings(entityId: string, fiscalYear?: number) {
  const api = useWaterMeterApi();
  return useQuery({
    queryKey: ["entities", entityId, "water-meter-readings", fiscalYear],
    queryFn: () => api.getWaterMeterReadings(entityId, fiscalYear!),
    enabled: !!entityId && !!fiscalYear,
    staleTime: 30_000,
  });
}

export function useRecordWaterMeterReadings(entityId: string) {
  const api = useWaterMeterApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordWaterMeterReadingsPayload) =>
      api.recordWaterMeterReadings(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = [
        "entities",
        entityId,
        "water-meter-readings",
        payload.fiscalYear,
      ];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<WaterMeterReadingsData | null>(queryKey);

      const totalConsumption = payload.readings.reduce(
        (sum, r) => sum + (r.currentReading - r.previousReading),
        0,
      );

      const optimistic: WaterMeterReadingsData = {
        id: payload.id,
        entityId,
        userId: "",
        fiscalYear: payload.fiscalYear,
        readings: payload.readings,
        totalConsumption,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<WaterMeterReadingsData | null>(
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
            "water-meter-readings",
            payload.fiscalYear,
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "water-distribution",
            payload.fiscalYear,
          ],
        });
      }, 1500);
    },
  });
}

export function useWaterDistribution(entityId: string, fiscalYear?: number) {
  const api = useWaterMeterApi();
  return useQuery({
    queryKey: ["entities", entityId, "water-distribution", fiscalYear],
    queryFn: () => api.getWaterDistribution(entityId, fiscalYear!),
    enabled: !!entityId && !!fiscalYear,
    staleTime: 30_000,
  });
}
