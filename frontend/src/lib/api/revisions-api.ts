import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export interface Revision {
  id: string;
  leaseId: string;
  entityId: string;
  userId: string;
  tenantId: string;
  unitId: string;
  tenantName: string;
  unitLabel: string;
  currentRentCents: number;
  newRentCents: number;
  differenceCents: number;
  baseIndexValue: number;
  baseIndexQuarter: string;
  baseIndexYear: number | null;
  newIndexValue: number;
  newIndexQuarter: string;
  newIndexYear: number;
  revisionIndexType: string;
  status: string;
  calculatedAt: string;
  approvedAt: string | null;
}

export interface BatchCalculationResult {
  calculated: number;
  skipped: string[];
  errors: string[];
}

export async function downloadRevisionLetter(
  entityId: string,
  revisionId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/revisions/${revisionId}/letter`,
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
  const filename = match?.[1] ?? `lettre-revision-${revisionId}.pdf`;
  const blob = await response.blob();
  return { blob, filename };
}

export function useRevisionsApi() {
  const { getToken } = useAuth();

  return {
    async getRevisions(entityId: string): Promise<Revision[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/revisions`,
        getToken,
      );
      const body = (await res.json()) as { data: Revision[] };
      return body.data;
    },

    async calculateRevisions(
      entityId: string,
    ): Promise<BatchCalculationResult> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/revisions/calculate`,
        getToken,
        { method: "POST" },
      );
      return res.json();
    },

    async approveRevisions(
      entityId: string,
      revisionIds: string[],
    ): Promise<void> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/revisions/approve`,
        getToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revisionIds }),
        },
      );
      if (!res.ok) {
        throw new Error("Erreur lors de l'approbation des révisions");
      }
    },
  };
}
