import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface ChargeEntryData {
  chargeCategoryId: string;
  label: string;
  amountCents: number;
}

export interface AnnualChargesData {
  id: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  charges: ChargeEntryData[];
  totalAmountCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAnnualChargesPayload {
  id: string;
  fiscalYear: number;
  charges: ChargeEntryData[];
}

export interface ProvisionDetail {
  chargeCategoryId: string | null;
  categoryLabel: string;
  totalCents: number;
}

export interface ProvisionsData {
  totalProvisionsCents: number;
  details: ProvisionDetail[];
}

export function useAnnualChargesApi() {
  const { getToken } = useAuth();

  return {
    async getAnnualCharges(
      entityId: string,
      fiscalYear?: number,
    ): Promise<AnnualChargesData | null> {
      const params = fiscalYear ? `?fiscalYear=${fiscalYear}` : "";
      const res = await fetchWithAuth(
        `/entities/${entityId}/annual-charges${params}`,
        getToken,
      );
      const body = (await res.json()) as { data: AnnualChargesData | null };
      return body.data;
    },

    async recordAnnualCharges(
      entityId: string,
      payload: RecordAnnualChargesPayload,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/annual-charges`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },

    async getProvisionsCollected(
      entityId: string,
      fiscalYear: number,
    ): Promise<ProvisionsData> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/provisions?fiscalYear=${fiscalYear}`,
        getToken,
      );
      const body = (await res.json()) as { data: ProvisionsData };
      return body.data;
    },
  };
}
