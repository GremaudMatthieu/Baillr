"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useRentCallsApi,
  downloadRentCallPdf,
  type RentCallData,
  type GenerationResult,
  type SendResult,
  type DashboardKpisData,
  type TreasuryMonthData,
} from "@/lib/api/rent-calls-api";

export type {
  RentCallData,
  GenerationResult,
  SendResult,
  DashboardKpisData,
  TreasuryMonthData,
};

export function useDashboardKpis(entityId: string, month: string) {
  const api = useRentCallsApi();
  return useQuery({
    queryKey: ["entities", entityId, "dashboard-kpis", month],
    queryFn: () => api.getDashboardKpis(entityId, month),
    enabled: !!entityId && !!month,
    staleTime: 30_000,
  });
}

export function useTreasuryChart(entityId: string, months: number) {
  const api = useRentCallsApi();
  return useQuery({
    queryKey: ["entities", entityId, "treasury-chart", months],
    queryFn: () => api.getTreasuryChart(entityId, months),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useRentCalls(entityId: string, month?: string) {
  const api = useRentCallsApi();
  return useQuery({
    queryKey: ["entities", entityId, "rent-calls", month ?? "all"],
    queryFn: () => api.getRentCalls(entityId, month),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useDownloadRentCallPdf(entityId: string) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(
    async (rentCallId: string) => {
      setIsDownloading(true);
      setDownloadingId(rentCallId);
      setError(null);
      try {
        const { blob, filename } = await downloadRentCallPdf(
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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de téléchargement",
        );
      } finally {
        setIsDownloading(false);
        setDownloadingId(null);
      }
    },
    [entityId, getToken],
  );

  return { downloadPdf, isDownloading, downloadingId, error };
}

export function useSendRentCallsByEmail(entityId: string) {
  const api = useRentCallsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (month: string) => api.sendRentCallsByEmail(entityId, month),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "units"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "dashboard-kpis"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "treasury-chart"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities"],
        });
      }, 1500);
    },
  });
}

export function useGenerateRentCalls(entityId: string) {
  const api = useRentCallsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (month: string) => api.generateRentCalls(entityId, month),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "leases"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "dashboard-kpis"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "treasury-chart"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities"],
        });
      }, 1500);
    },
  });
}
