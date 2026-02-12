import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface LeaseData {
  id: string;
  entityId: string;
  userId: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  rentAmountCents: number;
  securityDepositCents: number;
  monthlyDueDate: number;
  revisionIndexType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeasePayload {
  id: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  rentAmountCents: number;
  securityDepositCents: number;
  monthlyDueDate: number;
  revisionIndexType: string;
}

export function useLeasesApi() {
  const { getToken } = useAuth();

  return {
    async getLeases(entityId: string): Promise<LeaseData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/leases`,
        getToken,
      );
      const body = (await res.json()) as { data: LeaseData[] };
      return body.data;
    },

    async getLease(id: string): Promise<LeaseData> {
      const res = await fetchWithAuth(`/leases/${id}`, getToken);
      const body = (await res.json()) as { data: LeaseData };
      return body.data;
    },

    async createLease(
      entityId: string,
      payload: CreateLeasePayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${entityId}/leases`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };
}
