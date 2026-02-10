import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface BankAccountData {
  id: string;
  entityId: string;
  type: "bank_account" | "cash_register";
  label: string;
  iban: string | null;
  bic: string | null;
  bankName: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddBankAccountPayload {
  accountId: string;
  type: "bank_account" | "cash_register";
  label: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  isDefault: boolean;
}

export interface UpdateBankAccountPayload {
  label?: string;
  iban?: string | null;
  bic?: string | null;
  bankName?: string | null;
  isDefault?: boolean;
}

export function useBankAccountsApi() {
  const { getToken } = useAuth();

  return {
    async getBankAccounts(entityId: string): Promise<BankAccountData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-accounts`,
        getToken,
      );
      const body = (await res.json()) as { data: BankAccountData[] };
      return body.data;
    },

    async addBankAccount(
      entityId: string,
      payload: AddBankAccountPayload,
    ): Promise<void> {
      await fetchWithAuth(`/entities/${entityId}/bank-accounts`, getToken, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async updateBankAccount(
      entityId: string,
      accountId: string,
      payload: UpdateBankAccountPayload,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/bank-accounts/${accountId}`,
        getToken,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
    },

    async removeBankAccount(
      entityId: string,
      accountId: string,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/bank-accounts/${accountId}`,
        getToken,
        {
          method: "DELETE",
        },
      );
    },
  };
}
