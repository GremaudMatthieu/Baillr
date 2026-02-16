import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

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

export async function downloadAccountBookExcel(
  entityId: string,
  filters: AccountingFilters | undefined,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) throw new Error("Authentication required");

  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.tenantId) params.set("tenantId", filters.tenantId);

  const query = params.toString();
  const url = `${BACKEND_URL}/api/entities/${entityId}/accounting/export${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let message = `Download failed: ${response.status}`;
    if (contentType?.includes("application/json")) {
      const error = (await response.json()) as { message?: string };
      if (error.message) message = error.message;
    }
    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const filename = match?.[1] ?? `livre-comptes-${entityId}.xlsx`;
  const blob = await response.blob();
  return { blob, filename };
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
