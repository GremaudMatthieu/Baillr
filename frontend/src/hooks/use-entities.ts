"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useEntitiesApi,
  type CreateEntityPayload,
  type UpdateEntityPayload,
  type EntityData,
} from "@/lib/api/entities-api";

export function useEntities() {
  const api = useEntitiesApi();
  return useQuery({
    queryKey: ["entities"],
    queryFn: () => api.getEntities(),
  });
}

export function useEntity(id: string) {
  const api = useEntitiesApi();
  return useQuery({
    queryKey: ["entities", id],
    queryFn: () => api.getEntity(id),
    enabled: !!id,
  });
}

export function useCreateEntity() {
  const api = useEntitiesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEntityPayload) => api.createEntity(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["entities"] });
      const previous = queryClient.getQueryData<EntityData[]>(["entities"]);

      const optimistic: EntityData = {
        id: payload.id,
        userId: "",
        type: payload.type,
        name: payload.name,
        siret: payload.siret ?? null,
        addressStreet: payload.address.street,
        addressPostalCode: payload.address.postalCode,
        addressCity: payload.address.city,
        addressCountry: payload.address.country,
        addressComplement: payload.address.complement ?? null,
        legalInformation: payload.legalInformation ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<EntityData[]>(["entities"], (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["entities"], context.previous);
      }
    },
    onSettled: () => {
      // Delayed invalidation: let the projection process the event,
      // then reconcile the cache with the actual read model
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["entities"] });
      }, 1500);
    },
  });
}

export function useUpdateEntity() {
  const api = useEntitiesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEntityPayload }) =>
      api.updateEntity(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["entities"] });
      await queryClient.cancelQueries({ queryKey: ["entities", id] });

      const previousList = queryClient.getQueryData<EntityData[]>(["entities"]);
      const previousDetail = queryClient.getQueryData<EntityData>(["entities", id]);

      const applyUpdate = (entity: EntityData): EntityData => ({
        ...entity,
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.siret !== undefined && { siret: payload.siret ?? null }),
        ...(payload.address !== undefined && {
          addressStreet: payload.address.street,
          addressPostalCode: payload.address.postalCode,
          addressCity: payload.address.city,
          addressCountry: payload.address.country,
          addressComplement: payload.address.complement ?? null,
        }),
        ...(payload.legalInformation !== undefined && {
          legalInformation: payload.legalInformation ?? null,
        }),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<EntityData[]>(["entities"], (old) =>
        old?.map((e) => (e.id === id ? applyUpdate(e) : e)),
      );

      if (previousDetail) {
        queryClient.setQueryData<EntityData>(["entities", id], applyUpdate(previousDetail));
      }

      return { previousList, previousDetail };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(["entities"], context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(["entities", id], context.previousDetail);
      }
    },
    onSettled: (_data, _error, { id }) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["entities"] });
        void queryClient.invalidateQueries({ queryKey: ["entities", id] });
      }, 1500);
    },
  });
}
