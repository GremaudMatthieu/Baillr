"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useUnitsApi,
  type CreateUnitPayload,
  type UpdateUnitPayload,
  type UnitData,
} from "@/lib/api/units-api";

export function useUnits(propertyId: string) {
  const api = useUnitsApi();
  return useQuery({
    queryKey: ["properties", propertyId, "units"],
    queryFn: () => api.getUnits(propertyId),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useUnit(unitId: string) {
  const api = useUnitsApi();
  return useQuery({
    queryKey: ["units", unitId],
    queryFn: () => api.getUnit(unitId),
    enabled: !!unitId,
    staleTime: 30_000,
  });
}

export function useCreateUnit(propertyId: string) {
  const api = useUnitsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitPayload) =>
      api.createUnit(propertyId, payload),
    onMutate: async (payload) => {
      const queryKey = ["properties", propertyId, "units"];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UnitData[]>(queryKey);

      const optimistic: UnitData = {
        id: payload.id,
        propertyId,
        userId: "",
        identifier: payload.identifier,
        type: payload.type,
        floor: payload.floor ?? null,
        surfaceArea: payload.surfaceArea,
        billableOptions: payload.billableOptions ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<UnitData[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["properties", propertyId, "units"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "units"],
        });
      }, 1500);
    },
  });
}

export function useUpdateUnit(unitId: string, propertyId: string) {
  const api = useUnitsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUnitPayload) =>
      api.updateUnit(unitId, payload),
    onMutate: async (payload) => {
      const listKey = ["properties", propertyId, "units"];
      const detailKey = ["units", unitId];

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousList = queryClient.getQueryData<UnitData[]>(listKey);
      const previousDetail = queryClient.getQueryData<UnitData>(detailKey);

      const applyUpdate = (u: UnitData): UnitData => ({
        ...u,
        ...(payload.identifier !== undefined && {
          identifier: payload.identifier,
        }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.floor !== undefined && { floor: payload.floor ?? null }),
        ...(payload.surfaceArea !== undefined && {
          surfaceArea: payload.surfaceArea,
        }),
        ...(payload.billableOptions !== undefined && {
          billableOptions: payload.billableOptions,
        }),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<UnitData[]>(listKey, (old) =>
        old?.map((u) => (u.id === unitId ? applyUpdate(u) : u)),
      );

      if (previousDetail) {
        queryClient.setQueryData<UnitData>(
          detailKey,
          applyUpdate(previousDetail),
        );
      }

      return { previousList, previousDetail };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          ["properties", propertyId, "units"],
          context.previousList,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(["units", unitId], context.previousDetail);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["properties", propertyId, "units"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["units", unitId],
        });
      }, 1500);
    },
  });
}
