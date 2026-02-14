import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface AccountEntryData {
  id: string;
  type: "debit" | "credit";
  category: "rent_call" | "payment" | "overpayment_credit" | "adjustment";
  description: string;
  amountCents: number;
  balanceCents: number;
  referenceId: string;
  referenceMonth: string;
  entryDate: string;
}

export interface PaymentData {
  id: string;
  transactionId: string;
  bankStatementId: string | null;
  amountCents: number;
  payerName: string;
  paymentDate: string;
  paymentMethod: string;
  paymentReference: string | null;
  recordedAt: string;
}

export function useAccountEntriesApi() {
  const { getToken } = useAuth();

  return {
    async getTenantAccount(
      entityId: string,
      tenantId: string,
    ): Promise<{ entries: AccountEntryData[]; balanceCents: number }> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/tenants/${tenantId}/account`,
        getToken,
      );
      return (await res.json()) as {
        entries: AccountEntryData[];
        balanceCents: number;
      };
    },

    async getRentCallPayments(
      entityId: string,
      rentCallId: string,
    ): Promise<PaymentData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/${rentCallId}/payments`,
        getToken,
      );
      const body = (await res.json()) as { data: PaymentData[] };
      return body.data;
    },
  };
}
