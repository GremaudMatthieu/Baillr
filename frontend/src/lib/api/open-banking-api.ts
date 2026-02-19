"use client";

import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface BankConnectionData {
  id: string;
  entityId: string;
  bankAccountId: string;
  provider: string;
  institutionId: string;
  institutionName: string;
  requisitionId: string;
  agreementId: string;
  agreementExpiry: string;
  accountIds: string[];
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionData {
  id: string;
  name: string;
  logo: string;
}

export interface SyncResult {
  imported: number;
}

export interface InitiateConnectionResult {
  link: string;
  reference: string;
}

export interface CompleteConnectionResult {
  status: string;
  connectionId: string;
}

interface BridgeBankRaw {
  id: number;
  name: string;
  country_code: string;
  logo_url: string | null;
}

export function useOpenBankingApi() {
  const { getToken } = useAuth();

  return {
    async getStatus(): Promise<{ available: boolean }> {
      const res = await fetchWithAuth("/open-banking/status", getToken);
      return (await res.json()) as { available: boolean };
    },

    async getInstitutions(
      entityId: string,
      country: string = "fr",
    ): Promise<InstitutionData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/open-banking/institutions?country=${encodeURIComponent(country)}`,
        getToken,
      );
      const body = (await res.json()) as { data: BridgeBankRaw[] };
      return body.data.map((b) => ({
        id: String(b.id),
        name: b.name,
        logo: b.logo_url ?? "",
      }));
    },

    async initiateBankConnection(
      entityId: string,
      bankAccountId: string,
      institutionId: string,
    ): Promise<InitiateConnectionResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-accounts/${bankAccountId}/connect`,
        getToken,
        {
          method: "POST",
          body: JSON.stringify({ institutionId }),
        },
      );
      return (await res.json()) as InitiateConnectionResult;
    },

    async completeBankConnection(
      entityId: string,
      bankAccountId: string,
    ): Promise<CompleteConnectionResult> {
      const url = `/entities/${entityId}/open-banking/callback?bankAccountId=${encodeURIComponent(bankAccountId)}`;
      const res = await fetchWithAuth(url, getToken);
      return (await res.json()) as CompleteConnectionResult;
    },

    async getBankConnections(
      entityId: string,
    ): Promise<BankConnectionData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/bank-connections`,
        getToken,
      );
      const body = (await res.json()) as { data: BankConnectionData[] };
      return body.data;
    },

    async syncBankConnection(
      entityId: string,
      connectionId: string,
      options?: { since?: string; until?: string },
    ): Promise<SyncResult> {
      const params = new URLSearchParams();
      if (options?.since) params.set("since", options.since);
      if (options?.until) params.set("until", options.until);
      const qs = params.toString();
      const url = `/entities/${entityId}/bank-connections/${connectionId}/sync${qs ? `?${qs}` : ""}`;
      const res = await fetchWithAuth(url, getToken, { method: "POST" });
      return (await res.json()) as SyncResult;
    },

    async disconnectBankConnection(
      entityId: string,
      connectionId: string,
    ): Promise<void> {
      await fetchWithAuth(
        `/entities/${entityId}/bank-connections/${connectionId}`,
        getToken,
        { method: "DELETE" },
      );
    },
  };
}
