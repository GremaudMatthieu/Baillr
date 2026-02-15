import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface ChargeCategoryData {
  id: string;
  entityId: string;
  slug: string;
  label: string;
  isStandard: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useChargeCategoriesApi() {
  const { getToken } = useAuth();

  return {
    async getChargeCategories(
      entityId: string,
    ): Promise<ChargeCategoryData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/charge-categories`,
        getToken,
      );
      const body = (await res.json()) as { data: ChargeCategoryData[] };
      return body.data;
    },

    async createChargeCategory(
      entityId: string,
      label: string,
    ): Promise<ChargeCategoryData> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/charge-categories`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify({ label }),
        },
      );
      const body = (await res.json()) as { data: ChargeCategoryData };
      return body.data;
    },

    async deleteChargeCategory(
      entityId: string,
      id: string,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/charge-categories/${id}`,
        getToken,
        { method: "DELETE" },
      );
    },
  };
}
