import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface InseeIndexData {
  id: string;
  type: string;
  quarter: string;
  year: number;
  value: number;
  entityId: string;
  userId: string;
  source: "manual" | "auto";
  createdAt: string;
}

export interface FetchInseeIndicesResult {
  fetched: number;
  newIndices: number;
  skipped: number;
}

export interface RecordInseeIndexPayload {
  id: string;
  type: string;
  quarter: string;
  year: number;
  value: number;
}

export function useInseeIndicesApi() {
  const { getToken } = useAuth();

  return {
    async getInseeIndices(
      entityId: string,
      type?: string,
    ): Promise<InseeIndexData[]> {
      const params = type ? `?type=${encodeURIComponent(type)}` : "";
      const res = await fetchWithAuth(
        `/entities/${entityId}/insee-indices${params}`,
        getToken,
      );
      const body = (await res.json()) as { data: InseeIndexData[] };
      return body.data;
    },

    async recordInseeIndex(
      entityId: string,
      payload: RecordInseeIndexPayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${entityId}/insee-indices`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async fetchInseeIndices(
      entityId: string,
    ): Promise<FetchInseeIndicesResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/insee-indices/fetch`,
        getToken,
        { method: "POST" },
      );
      return (await res.json()) as FetchInseeIndicesResult;
    },
  };
}
