import { useAuth } from "@clerk/nextjs";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface EntityData {
  id: string;
  userId: string;
  type: "sci" | "nom_propre";
  name: string;
  siret: string | null;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  addressCountry: string;
  addressComplement: string | null;
  legalInformation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEntityPayload {
  id: string;
  type: "sci" | "nom_propre";
  name: string;
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

async function fetchWithAuth(
  path: string,
  getToken: () => Promise<string | null>,
  options: RequestInit = {},
) {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(`${BACKEND_URL}/api${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = `Request failed: ${response.status}`;
    if (contentType?.includes("application/json")) {
      const error = (await response.json()) as { message?: string };
      if (error.message) {
        message = error.message;
      }
    }
    throw new Error(message);
  }
  return response;
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
  };
}
