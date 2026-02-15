import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface RentCallBillingLine {
  chargeCategoryId: string;
  categoryLabel: string;
  amountCents: number;
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
  sentAt: string | null;
  paidAt: string | null;
  paidAmountCents: number | null;
  transactionId: string | null;
  bankStatementId: string | null;
  payerName: string | null;
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  recipientEmail: string | null;
  paymentStatus: "partial" | "paid" | "overpaid" | null;
  remainingBalanceCents: number | null;
  overpaymentCents: number | null;
  createdAt: string;
}

export interface GenerationResult {
  generated: number;
  totalAmountCents: number;
  exceptions: string[];
}

export interface SendResult {
  sent: number;
  failed: number;
  totalAmountCents: number;
  failures: string[];
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function downloadPdfFromEndpoint(
  entityId: string,
  rentCallId: string,
  pathSuffix: string,
  fallbackFilename: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/rent-calls/${rentCallId}/${pathSuffix}`,
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
  const filename = match?.[1] ?? fallbackFilename;
  const blob = await response.blob();
  return { blob, filename };
}

export function downloadRentCallPdf(
  entityId: string,
  rentCallId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  return downloadPdfFromEndpoint(entityId, rentCallId, "pdf", `appel-loyer-${rentCallId}.pdf`, getToken);
}

export function downloadReceiptPdf(
  entityId: string,
  rentCallId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  return downloadPdfFromEndpoint(entityId, rentCallId, "receipt", `quittance-${rentCallId}.pdf`, getToken);
}

export interface UnpaidRentCallData {
  id: string;
  entityId: string;
  leaseId: string;
  tenantId: string;
  unitId: string;
  month: string;
  totalAmountCents: number;
  paidAmountCents: number | null;
  remainingBalanceCents: number | null;
  paymentStatus: string | null;
  sentAt: string;
  tenantFirstName: string;
  tenantLastName: string;
  tenantCompanyName: string | null;
  tenantType: string;
  unitIdentifier: string;
  dueDate: string;
  daysLate: number;
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

    async sendRentCallsByEmail(
      entityId: string,
      month: string,
    ): Promise<SendResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/send`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify({ month }),
        },
      );
      return (await res.json()) as SendResult;
    },

    async recordManualPayment(
      entityId: string,
      rentCallId: string,
      data: {
        amountCents: number;
        paymentMethod: 'cash' | 'check';
        paymentDate: string;
        payerName: string;
        paymentReference?: string;
      },
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/rent-calls/${rentCallId}/payments/manual`,
        getToken,
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      );
    },

    async getUnpaidRentCalls(
      entityId: string,
    ): Promise<UnpaidRentCallData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/unpaid`,
        getToken,
      );
      const body = (await res.json()) as { data: UnpaidRentCallData[] };
      return body.data;
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
