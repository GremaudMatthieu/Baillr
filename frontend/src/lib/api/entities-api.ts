import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface EntityData {
  id: string;
  userId: string;
  type: "sci" | "nom_propre";
  name: string;
  email: string;
  siret: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressCountry: string;
  addressComplement: string | null;
  legalInformation: string | null;
  latePaymentDelayDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityPayload {
  id: string;
  type: "sci" | "nom_propre";
  name: string;
  email: string;
  siret?: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement?: string | null;
  };
  legalInformation?: string;
}

export interface UpdateEntityPayload {
  name?: string;
  email?: string;
  siret?: string | null;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
    complement?: string | null;
  };
  legalInformation?: string | null;
}

export function useEntitiesApi() {
  const { getToken } = useAuth();

  return {
    async getEntities(): Promise<EntityData[]> {
      const res = await fetchWithAuth("/entities", getToken);
      const body = (await res.json()) as { data: EntityData[] };
      return body.data;
    },

    async getEntity(id: string): Promise<EntityData> {
      const res = await fetchWithAuth(`/entities/${id}`, getToken);
      const body = (await res.json()) as { data: EntityData };
      return body.data;
    },

    async createEntity(payload: CreateEntityPayload): Promise<void> {
      await fetchWithAuth("/entities", getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateEntity(
      id: string,
      payload: UpdateEntityPayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${id}`, getToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    async configureLatePaymentDelay(
      entityId: string,
      days: number,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/late-payment-delay`,
        getToken,
        {
          method: "PUT",
          body: JSON.stringify({ days }),
        },
      );
    },
  };
}
