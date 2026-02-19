"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAlertPreferencesApi,
  type AlertPreferenceData,
  type UpdateAlertPreferencesPayload,
} from "@/lib/api/alert-preferences-api";

export function useAlertPreferences(entityId: string) {
  const api = useAlertPreferencesApi();
  return useQuery({
    queryKey: ["entities", entityId, "alert-preferences"],
    queryFn: () => api.getAlertPreferences(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useUpdateAlertPreferences(entityId: string) {
  const api = useAlertPreferencesApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAlertPreferencesPayload) =>
      api.updateAlertPreferences(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "alert-preferences"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<AlertPreferenceData[]>(queryKey);

      queryClient.setQueryData<AlertPreferenceData[]>(queryKey, (old) => {
        if (!old) return old;
        const updates = new Map(
          payload.preferences.map((p) => [p.alertType, p.enabled]),
        );
        return old.map((pref) => {
          const newEnabled = updates.get(pref.alertType);
          if (newEnabled !== undefined) {
            return { ...pref, enabled: newEnabled };
          }
          return pref;
        });
      });

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "alert-preferences"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "alert-preferences"],
        });
      }, 1500);
    },
  });
}
