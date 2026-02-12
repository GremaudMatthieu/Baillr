"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useTenantsApi,
  type RegisterTenantPayload,
  type UpdateTenantPayload,
  type TenantData,
} from "@/lib/api/tenants-api";

export function useTenants(entityId: string) {
  const api = useTenantsApi();
  return useQuery({
    queryKey: ["entities", entityId, "tenants"],
    queryFn: () => api.getTenants(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useTenant(tenantId: string) {
  const api = useTenantsApi();
  return useQuery({
    queryKey: ["tenants", tenantId],
    queryFn: () => api.getTenant(tenantId),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function useRegisterTenant(entityId: string) {
  const api = useTenantsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterTenantPayload) =>
      api.registerTenant(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "tenants"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<TenantData[]>(queryKey);

      const optimistic: TenantData = {
        id: payload.id,
        entityId,
        userId: "",
        type: payload.type,
        firstName: payload.firstName,
        lastName: payload.lastName,
        companyName: payload.companyName ?? null,
        siret: payload.siret ?? null,
        email: payload.email,
        phoneNumber: payload.phoneNumber ?? null,
        addressStreet: payload.address?.street ?? null,
        addressPostalCode: payload.address?.postalCode ?? null,
        addressCity: payload.address?.city ?? null,
        addressComplement: payload.address?.complement ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<TenantData[]>(queryKey, (old) => [
        ...(old ?? []),
        optimistic,
      ]);

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "tenants"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "tenants"],
        });
      }, 1500);
    },
  });
}

export function useUpdateTenant(tenantId: string, entityId: string) {
  const api = useTenantsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantPayload) =>
      api.updateTenant(tenantId, payload),
    onMutate: async (payload) => {
      const listKey = ["entities", entityId, "tenants"];
      const detailKey = ["tenants", tenantId];

      await queryClient.cancelQueries({ queryKey: listKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousList =
        queryClient.getQueryData<TenantData[]>(listKey);
      const previousDetail =
        queryClient.getQueryData<TenantData>(detailKey);

      const applyUpdate = (t: TenantData): TenantData => ({
        ...t,
        ...(payload.firstName !== undefined && { firstName: payload.firstName }),
        ...(payload.lastName !== undefined && { lastName: payload.lastName }),
        ...(payload.companyName !== undefined && {
          companyName: payload.companyName,
        }),
        ...(payload.siret !== undefined && { siret: payload.siret }),
        ...(payload.email !== undefined && { email: payload.email }),
        ...(payload.phoneNumber !== undefined && {
          phoneNumber: payload.phoneNumber,
        }),
        ...(payload.address !== undefined && {
          addressStreet: payload.address.street ?? null,
          addressPostalCode: payload.address.postalCode ?? null,
          addressCity: payload.address.city ?? null,
          addressComplement: payload.address.complement ?? null,
        }),
        updatedAt: new Date().toISOString(),
      });

      queryClient.setQueryData<TenantData[]>(listKey, (old) =>
        old?.map((t) => (t.id === tenantId ? applyUpdate(t) : t)),
      );

      if (previousDetail) {
        queryClient.setQueryData<TenantData>(
          detailKey,
          applyUpdate(previousDetail),
        );
      }

      return { previousList, previousDetail };
    },
    onError: (_err, _payload, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(
          ["entities", entityId, "tenants"],
          context.previousList,
        );
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["tenants", tenantId],
          context.previousDetail,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "tenants"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["tenants", tenantId],
        });
      }, 1500);
    },
  });
}
