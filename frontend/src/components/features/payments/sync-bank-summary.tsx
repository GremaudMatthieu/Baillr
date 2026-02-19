"use client";

import { RefreshCw } from "lucide-react";

interface SyncBankSummaryProps {
  imported: number;
  institutionName: string | null;
}

export function SyncBankSummary({
  imported,
  institutionName,
}: SyncBankSummaryProps) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
        <RefreshCw className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">Synchronisation terminée</span>
      </div>
      <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
        {imported > 0 ? (
          <>
            {imported} transaction{imported > 1 ? "s" : ""} importée
            {imported > 1 ? "s" : ""}
            {institutionName ? ` depuis ${institutionName}` : ""}
          </>
        ) : (
          <>Aucune nouvelle transaction{institutionName ? ` depuis ${institutionName}` : ""}</>
        )}
      </p>
    </div>
  );
}
