import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface BillingLineData {
  label: string;
  amountCents: number;
  type: string;
}

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
  billingLines: BillingLineData[];
  revisionDay: number | null;
  revisionMonth: number | null;
  referenceQuarter: string | null;
  referenceYear: number | null;
  baseIndexValue: number | null;
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

    async configureBillingLines(
      leaseId: string,
      payload: { billingLines: BillingLineData[] },
    ): Promise<void> {
      await fetchWithAuth(`/leases/${leaseId}/billing-lines`, getToken, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    async configureRevisionParameters(
      leaseId: string,
      payload: ConfigureRevisionParametersPayload,
    ): Promise<void> {
      await fetchWithAuth(
        `/leases/${leaseId}/revision-parameters`,
        getToken,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
    },
  };
}

export interface ConfigureRevisionParametersPayload {
  revisionDay: number;
  revisionMonth: number;
  referenceQuarter: "Q1" | "Q2" | "Q3" | "Q4";
  referenceYear: number;
  baseIndexValue?: number | null;
}
