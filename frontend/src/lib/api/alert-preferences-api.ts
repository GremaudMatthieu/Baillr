import { useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "./fetch-with-auth";

export interface AlertPreferenceData {
  id: string | null;
  entityId: string;
  userId: string;
  alertType: string;
  enabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateAlertPreferencesPayload {
  preferences: Array<{ alertType: string; enabled: boolean }>;
}

export function useAlertPreferencesApi() {
  const { getToken } = useAuth();

  return {
    async getAlertPreferences(
      entityId: string,
    ): Promise<AlertPreferenceData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/alert-preferences`,
        getToken,
      );
      const body = (await res.json()) as { data: AlertPreferenceData[] };
      return body.data;
    },

    async updateAlertPreferences(
      entityId: string,
      payload: UpdateAlertPreferencesPayload,
    ): Promise<AlertPreferenceData[]> {
      const res = await fetchWithAuth(
        `/entities/${entityId}/alert-preferences`,
        getToken,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json()) as { data: AlertPreferenceData[] };
      return body.data;
    },
  };
}
