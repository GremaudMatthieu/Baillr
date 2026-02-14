"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useEscalationApi,
  downloadFormalNoticePdf,
  downloadStakeholderLetterPdf,
  type EscalationStatusData,
} from "@/lib/api/escalation-api";

export type { EscalationStatusData };

export function useEscalationStatus(
  entityId: string,
  rentCallId: string | null,
) {
  const api = useEscalationApi();
  return useQuery<EscalationStatusData>({
    queryKey: ["entities", entityId, "rent-calls", rentCallId, "escalation"],
    queryFn: () => api.getEscalationStatus(entityId, rentCallId!),
    enabled: !!entityId && !!rentCallId,
    staleTime: 30_000,
  });
}

export function useEscalationStatuses(
  entityId: string | undefined,
  rentCallIds: string[],
) {
  const api = useEscalationApi();
  const key = rentCallIds.slice().sort().join(",");
  return useQuery<EscalationStatusData[]>({
    queryKey: ["entities", entityId, "escalation-statuses", key],
    queryFn: () => api.getEscalationStatuses(entityId!, rentCallIds),
    enabled: !!entityId && rentCallIds.length > 0,
    staleTime: 30_000,
  });
}

export function useSendReminderEmail(entityId: string) {
  const api = useEscalationApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rentCallId: string) =>
      api.sendReminderEmail(entityId, rentCallId),
    onSettled: (_data, _error, rentCallId) => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: [
            "entities",
            entityId,
            "rent-calls",
            rentCallId,
            "escalation",
          ],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls", "unpaid"],
        });
      }, 1500);
    },
  });
}

export function useDownloadFormalNotice(entityId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (rentCallId: string) => {
      setIsDownloading(true);
      setError(null);
      try {
        const { blob, filename } = await downloadFormalNoticePdf(
          entityId,
          rentCallId,
          getToken,
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "entities",
              entityId,
              "rent-calls",
              rentCallId,
              "escalation",
            ],
          });
        }, 1500);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de téléchargement",
        );
      } finally {
        setIsDownloading(false);
      }
    },
    [entityId, getToken, queryClient],
  );

  return { download, isDownloading, error };
}

export function useDownloadStakeholderLetter(entityId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (
      rentCallId: string,
      recipientType: "insurance" | "lawyer" | "guarantor",
    ) => {
      setIsDownloading(true);
      setDownloadingType(recipientType);
      setError(null);
      try {
        const { blob, filename } = await downloadStakeholderLetterPdf(
          entityId,
          rentCallId,
          recipientType,
          getToken,
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey: [
              "entities",
              entityId,
              "rent-calls",
              rentCallId,
              "escalation",
            ],
          });
        }, 1500);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de téléchargement",
        );
      } finally {
        setIsDownloading(false);
        setDownloadingType(null);
      }
    },
    [entityId, getToken, queryClient],
  );

  return { download, isDownloading, downloadingType, error };
}
