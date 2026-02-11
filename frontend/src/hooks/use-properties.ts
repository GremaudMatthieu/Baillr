"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usePropertiesApi,
  type CreatePropertyPayload,
  type UpdatePropertyPayload,
  type PropertyData,
} from "@/lib/api/properties-api";

export function useProperties(entityId: string) {
  const api = usePropertiesApi();
  return useQuery({
    queryKey: ["entities", entityId, "properties"],
    queryFn: () => api.getProperties(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useProperty(propertyId: string) {
  const api = usePropertiesApi();
  return useQuery({
    queryKey: ["properties", propertyId],
    queryFn: () => api.getProperty(propertyId),
    enabled: !!propertyId,
    staleTime: 30_000,
  });
}

export function useCreateProperty(entityId: string) {
  const api = usePropertiesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyPayload) =>
      api.createProperty(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "properties"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<PropertyData[]>(queryKey);

      const optimistic: PropertyData = {
        id: payload.id,
        entityId,
        userId: "",
        name: payload.name,
        type: payload.type ?? null,
        addressStreet: payload.address.street,
        addressPostalCode: payload.address.postalCode,
        addressCity: payload.address.city,
        addressCountry: payload.address.country ?? "France",
        addressComplement: payload.address.complement ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PropertyData[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "properties"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "properties"],
        });
      }, 1500);
    },
  });
}

export function useUpdateProperty(propertyId: string, entityId: string) {
  const api = usePropertiesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePropertyPayload) =>
      api.updateProperty(propertyId, payload),
    onMutate: async (payload) => {
      const listKey = ["entities", entityId, "properties"];
      const detailKey = ["properties", propertyId];

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousList =
        queryClient.getQueryData<PropertyData[]>(listKey);
      const previousDetail =
        queryClient.getQueryData<PropertyData>(detailKey);

      const applyUpdate = (p: PropertyData): PropertyData => ({
        ...p,
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.type !== undefined && { type: payload.type ?? null }),
        ...(payload.address !== undefined && {
          addressStreet: payload.address.street,
          addressPostalCode: payload.address.postalCode,
          addressCity: payload.address.city,
          addressCountry: payload.address.country ?? p.addressCountry,
          addressComplement: payload.address.complement ?? null,
        }),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<PropertyData[]>(listKey, (old) =>
        old?.map((p) => (p.id === propertyId ? applyUpdate(p) : p)),
      );

      if (previousDetail) {
        queryClient.setQueryData<PropertyData>(
          detailKey,
          applyUpdate(previousDetail),
        );
      }

      return { previousList, previousDetail };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          ["entities", entityId, "properties"],
          context.previousList,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["properties", propertyId],
          context.previousDetail,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "properties"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["properties", propertyId],
        });
      }, 1500);
    },
  });
}
