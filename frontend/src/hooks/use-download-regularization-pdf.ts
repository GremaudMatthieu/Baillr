"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { downloadChargeRegularizationPdf } from "@/lib/api/charge-regularization-api";

export function useDownloadRegularizationPdf(
  entityId: string,
  fiscalYear: number,
) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingLeaseId, setDownloadingLeaseId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(
    async (leaseId: string) => {
      setIsDownloading(true);
      setDownloadingLeaseId(leaseId);
      setError(null);
      try {
        const { blob, filename } = await downloadChargeRegularizationPdf(
          entityId,
          fiscalYear,
          leaseId,
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
        setDownloadingLeaseId(null);
      }
    },
    [entityId, fiscalYear, getToken],
  );

  return { downloadPdf, isDownloading, downloadingLeaseId, error };
}
