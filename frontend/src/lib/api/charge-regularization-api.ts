import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface StatementChargeData {
  chargeCategoryId: string;
  label: string;
  totalChargeCents: number;
  tenantShareCents: number;
  provisionsPaidCents: number;
  isWaterByConsumption: boolean;
}

export interface StatementData {
  leaseId: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitIdentifier: string;
  occupancyStart: string;
  occupancyEnd: string;
  occupiedDays: number;
  daysInYear: number;
  charges: StatementChargeData[];
  totalShareCents: number;
  totalProvisionsPaidCents: number;
  balanceCents: number;
}

export interface ChargeRegularizationData {
  id: string;
  entityId: string;
  userId: string;
  fiscalYear: number;
  statements: StatementData[];
  totalBalanceCents: number;
  appliedAt: string | null;
  sentAt: string | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendChargeRegularizationResult {
  sent: number;
  failed: number;
  failures: string[];
}

export interface CalculateChargeRegularizationPayload {
  id: string;
  fiscalYear: number;
}

export function useChargeRegularizationApi() {
  const { getToken } = useAuth();

  return {
    async getChargeRegularization(
      entityId: string,
      fiscalYear: number,
    ): Promise<ChargeRegularizationData | null> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/charge-regularization?fiscalYear=${fiscalYear}`,
        getToken,
      );
      const body = (await res.json()) as {
        data: ChargeRegularizationData | null;
      };
      return body.data;
    },

    async getChargeRegularizations(
      entityId: string,
    ): Promise<ChargeRegularizationData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/charge-regularization`,
        getToken,
      );
      const body = (await res.json()) as {
        data: ChargeRegularizationData[];
      };
      return body.data;
    },

    async calculateChargeRegularization(
      entityId: string,
      payload: CalculateChargeRegularizationPayload,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/charge-regularization`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    },

    async applyChargeRegularization(
      entityId: string,
      fiscalYear: number,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/charge-regularizations/${fiscalYear}/apply`,
        getToken,
        { method: "POST" },
      );
    },

    async sendChargeRegularization(
      entityId: string,
      fiscalYear: number,
    ): Promise<SendChargeRegularizationResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/charge-regularizations/${fiscalYear}/send`,
        getToken,
        { method: "POST" },
      );
      return (await res.json()) as SendChargeRegularizationResult;
    },

    async settleChargeRegularization(
      entityId: string,
      fiscalYear: number,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/charge-regularizations/${fiscalYear}/settle`,
        getToken,
        { method: "POST" },
      );
    },
  };
}

export async function downloadChargeRegularizationPdf(
  entityId: string,
  fiscalYear: number,
  leaseId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/charge-regularization/${fiscalYear}/pdf/${leaseId}`,
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
  const filename =
    match?.[1] ?? `regularisation-charges-${fiscalYear}-${leaseId}.pdf`;
  const blob = await response.blob();
  return { blob, filename };
}
