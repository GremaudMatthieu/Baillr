"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  downloadAccountBookExcel,
  type AccountingFilters,
} from "@/lib/api/accounting-api";

export function useDownloadAccountBookExcel(entityId: string) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadExcel = useCallback(
    async (filters?: AccountingFilters) => {
      setIsDownloading(true);
      setError(null);
      try {
        const { blob, filename } = await downloadAccountBookExcel(
          entityId,
          filters,
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
      }
    },
    [entityId, getToken],
  );

  return { downloadExcel, isDownloading, error };
}
