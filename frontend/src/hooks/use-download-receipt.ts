"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { downloadReceiptPdf } from "@/lib/api/rent-calls-api";

export function useDownloadReceipt(entityId: string) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadReceipt = useCallback(
    async (rentCallId: string) => {
      setIsDownloading(true);
      setDownloadingId(rentCallId);
      setError(null);
      try {
        const { blob, filename } = await downloadReceiptPdf(
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

  return { downloadReceipt, isDownloading, downloadingId, error };
}
