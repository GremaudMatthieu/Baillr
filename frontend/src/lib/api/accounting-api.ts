import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface AccountEntryTenant {
  firstName: string;
  lastName: string;
  companyName: string | null;
  type: string;
}

export interface AccountEntryWithTenant {
  id: string;
  entityId: string;
  tenantId: string;
  type: string;
  category: string;
  description: string;
  amountCents: number;
  balanceCents: number;
  referenceId: string;
  referenceMonth: string;
  entryDate: string;
  createdAt: string;
  tenant: AccountEntryTenant;
}

export interface AccountBookData {
  entries: AccountEntryWithTenant[];
  totalBalanceCents: number;
  availableCategories: string[];
}

export interface AccountingFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  tenantId?: string;
}

export function useAccountingApi() {
  const { getToken } = useAuth();

  return {
    async getAccountBook(
      entityId: string,
      filters?: AccountingFilters,
    ): Promise<AccountBookData> {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set("startDate", filters.startDate);
      if (filters?.endDate) params.set("endDate", filters.endDate);
      if (filters?.category) params.set("category", filters.category);
      if (filters?.tenantId) params.set("tenantId", filters.tenantId);

      const query = params.toString();
      const url = `/entities/${entityId}/accounting${query ? `?${query}` : ""}`;
      const res = await fetchWithAuth(url, getToken);
      const body = (await res.json()) as { data: AccountBookData };
      return body.data;
    },
  };
}
