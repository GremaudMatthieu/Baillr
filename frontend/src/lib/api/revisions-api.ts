import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface Revision {
  id: string;
  leaseId: string;
  entityId: string;
  userId: string;
  tenantId: string;
  unitId: string;
  tenantName: string;
  unitLabel: string;
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  baseIndexValue: number;
  baseIndexQuarter: string;
  newIndexValue: number;
  newIndexQuarter: string;
  newIndexYear: number;
  revisionIndexType: string;
  status: string;
  calculatedAt: string;
  approvedAt: string | null;
}

export interface BatchCalculationResult {
  calculated: number;
  skipped: string[];
  errors: string[];
}

export function useRevisionsApi() {
  const { getToken } = useAuth();

  return {
    async getRevisions(entityId: string): Promise<Revision[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/revisions`,
        getToken,
      );
      const body = (await res.json()) as { data: Revision[] };
      return body.data;
    },

    async calculateRevisions(
      entityId: string,
    ): Promise<BatchCalculationResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/revisions/calculate`,
        getToken,
        { method: "POST" },
      );
      return res.json();
    },
  };
}
