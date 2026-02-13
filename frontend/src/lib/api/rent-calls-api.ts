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

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function downloadRentCallPdf(
  entityId: string,
  rentCallId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/rent-calls/${rentCallId}/pdf`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/pdf",
      },
    },
  );
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = `Download failed: ${response.status}`;
    if (contentType?.includes("application/json")) {
      const error = (await response.json()) as { message?: string };
      if (error.message) {
        message = error.message;
      }
    }
    throw new Error(message);
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1] ?? `appel-loyer-${rentCallId}.pdf`;
  const blob = await response.blob();
  return { blob, filename };
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
