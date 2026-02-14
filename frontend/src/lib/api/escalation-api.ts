import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface EscalationStatusData {
  rentCallId: string;
  tier1SentAt: string | null;
  tier1RecipientEmail: string | null;
  tier2SentAt: string | null;
  tier3SentAt: string | null;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function downloadFormalNoticePdf(
  entityId: string,
  rentCallId: string,
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/rent-calls/${rentCallId}/escalation/formal-notice`,
    {
      method: "POST",
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
  const filename = match?.[1] ?? `mise-en-demeure-${rentCallId}.pdf`;
  const blob = await response.blob();
  return { blob, filename };
}

export async function downloadStakeholderLetterPdf(
  entityId: string,
  rentCallId: string,
  recipientType: "insurance" | "lawyer" | "guarantor",
  getToken: () => Promise<string | null>,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  const response = await fetch(
    `${BACKEND_URL}/api/entities/${entityId}/rent-calls/${rentCallId}/escalation/stakeholder-notifications`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/pdf",
      },
      body: JSON.stringify({ recipientType }),
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
  const filename = match?.[1] ?? `signalement-${recipientType}-${rentCallId}.pdf`;
  const blob = await response.blob();
  return { blob, filename };
}

export function useEscalationApi() {
  const { getToken } = useAuth();

  return {
    async getEscalationStatus(
      entityId: string,
      rentCallId: string,
    ): Promise<EscalationStatusData> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/${rentCallId}/escalation`,
        getToken,
      );
      return (await res.json()) as EscalationStatusData;
    },

    async getEscalationStatuses(
      entityId: string,
      rentCallIds: string[],
    ): Promise<EscalationStatusData[]> {
      if (rentCallIds.length === 0) return [];
      const params = rentCallIds.join(",");
      const res = await fetchWithAuth(
        `/entities/${entityId}/escalations/batch?rentCallIds=${encodeURIComponent(params)}`,
        getToken,
      );
      return (await res.json()) as EscalationStatusData[];
    },

    async sendReminderEmail(
      entityId: string,
      rentCallId: string,
    ): Promise<{ sent: boolean }> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/rent-calls/${rentCallId}/escalation/reminder`,
        getToken,
        { method: "POST" },
      );
      return (await res.json()) as { sent: boolean };
    },
  };
}
