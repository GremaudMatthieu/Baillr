import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface PropertyData {
  id: string;
  entityId: string;
  userId: string;
  name: string;
  type: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressCountry: string;
  addressComplement: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyPayload {
  id: string;
  name: string;
  type?: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country?: string;
    complement?: string;
  };
}

export interface UpdatePropertyPayload {
  name?: string;
  type?: string | null;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country?: string;
    complement?: string;
  };
}

export function usePropertiesApi() {
  const { getToken } = useAuth();

  return {
    async getProperties(entityId: string): Promise<PropertyData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/properties`,
        getToken,
      );
      const body = (await res.json()) as { data: PropertyData[] };
      return body.data;
    },

    async getProperty(id: string): Promise<PropertyData> {
      const res = await fetchWithAuth(`/properties/${id}`, getToken);
      const body = (await res.json()) as { data: PropertyData };
      return body.data;
    },

    async createProperty(
      entityId: string,
      payload: CreatePropertyPayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${entityId}/properties`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateProperty(
      id: string,
      payload: UpdatePropertyPayload,
    ): Promise<void> {
      await fetchWithAuth(`/properties/${id}`, getToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  };
}
