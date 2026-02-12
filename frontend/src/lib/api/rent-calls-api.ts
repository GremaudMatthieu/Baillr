import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface RentCallBillingLine {
  label: string;
  amountCents: number;
  type: string;
}

export interface RentCallData {
  id: string;
  entityId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  month: string;
  rentAmountCents: number;
  billingLines: RentCallBillingLine[];
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number | null;
  totalDaysInMonth: number | null;
  createdAt: string;
}

export interface GenerationResult {
  generated: number;
  totalAmountCents: number;
  exceptions: string[];
}

export function useRentCallsApi() {
  const { getToken } = useAuth();

  return {
    async generateRentCalls(
      entityId: string,
      month: string,
    ): Promise<GenerationResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/generate`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify({ month }),
        },
      );
      return (await res.json()) as GenerationResult;
    },

    async getRentCalls(
      entityId: string,
      month?: string,
    ): Promise<RentCallData[]> {
      const url = month
        ? `/entities/${entityId}/rent-calls?month=${month}`
        : `/entities/${entityId}/rent-calls`;
      const res = await fetchWithAuth(url, getToken);
      const body = (await res.json()) as { data: RentCallData[] };
      return body.data;
    },
  };
}
