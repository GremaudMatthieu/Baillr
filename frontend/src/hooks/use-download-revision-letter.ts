"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { downloadRevisionLetter } from "@/lib/api/revisions-api";

export function useDownloadRevisionLetter(entityId: string) {
  const { getToken } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDownloadingRef = useRef(false);

  const downloadLetter = useCallback(
    async (revisionId: string) => {
      if (isDownloadingRef.current) return;
      isDownloadingRef.current = true;
      setIsDownloading(true);
      setDownloadingId(revisionId);
      setError(null);
      try {
        const { blob, filename } = await downloadRevisionLetter(
          entityId,
          revisionId,
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
        isDownloadingRef.current = false;
        setIsDownloading(false);
        setDownloadingId(null);
      }
    },
    [entityId, getToken],
  );

  return { downloadLetter, isDownloading, downloadingId, error };
}
