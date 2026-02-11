import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface UnitData {
  id: string;
  propertyId: string;
  userId: string;
  identifier: string;
  type: string;
  floor: number | null;
  surfaceArea: number;
  billableOptions: Array<{ label: string; amountCents: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitPayload {
  id: string;
  identifier: string;
  type: string;
  floor?: number;
  surfaceArea: number;
  billableOptions?: Array<{ label: string; amountCents: number }>;
}

export interface UpdateUnitPayload {
  identifier?: string;
  type?: string;
  floor?: number | null;
  surfaceArea?: number;
  billableOptions?: Array<{ label: string; amountCents: number }>;
}

export function useUnitsApi() {
  const { getToken } = useAuth();

  return {
    async getUnits(propertyId: string): Promise<UnitData[]> {
      const res = await fetchWithAuth(
        `/properties/${propertyId}/units`,
        getToken,
      );
      const body = (await res.json()) as { data: UnitData[] };
      return body.data;
    },

    async getUnit(id: string): Promise<UnitData> {
      const res = await fetchWithAuth(`/units/${id}`, getToken);
      const body = (await res.json()) as { data: UnitData };
      return body.data;
    },

    async createUnit(
      propertyId: string,
      payload: CreateUnitPayload,
    ): Promise<void> {
      await fetchWithAuth(`/properties/${propertyId}/units`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateUnit(
      id: string,
      payload: UpdateUnitPayload,
    ): Promise<void> {
      await fetchWithAuth(`/units/${id}`, getToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  };
}
