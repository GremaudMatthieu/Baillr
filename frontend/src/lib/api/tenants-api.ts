import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface TenantData {
  id: string;
  entityId: string;
  userId: string;
  type: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  siret: string | null;
  email: string;
  phoneNumber: string | null;
  addressStreet: string | null;
  addressPostalCode: string | null;
  addressCity: string | null;
  addressComplement: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterTenantPayload {
  id: string;
  type: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  siret?: string;
  email: string;
  phoneNumber?: string;
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
    complement?: string;
  };
}

export interface UpdateTenantPayload {
  firstName?: string;
  lastName?: string;
  companyName?: string | null;
  siret?: string | null;
  email?: string;
  phoneNumber?: string | null;
  address?: {
    street?: string;
    postalCode?: string;
    city?: string;
    complement?: string;
  };
}

export function useTenantsApi() {
  const { getToken } = useAuth();

  return {
    async getTenants(entityId: string): Promise<TenantData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/tenants`,
        getToken,
      );
      const body = (await res.json()) as { data: TenantData[] };
      return body.data;
    },

    async getTenant(id: string): Promise<TenantData> {
      const res = await fetchWithAuth(`/tenants/${id}`, getToken);
      const body = (await res.json()) as { data: TenantData };
      return body.data;
    },

    async registerTenant(
      entityId: string,
      payload: RegisterTenantPayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${entityId}/tenants`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateTenant(
      id: string,
      payload: UpdateTenantPayload,
    ): Promise<void> {
      await fetchWithAuth(`/tenants/${id}`, getToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  };
}
