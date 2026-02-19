"use client";

import { Upload } from "lucide-react";
import type { ImportResult } from "@/hooks/use-bank-statements";

interface ImportSummaryProps {
  result: ImportResult;
}

export function ImportSummary({ result }: ImportSummaryProps) {
  const credits = result.transactions.filter((t) => t.amountCents > 0);
  const debits = result.transactions.filter((t) => t.amountCents < 0);
  const duplicates = result.transactions.filter((t) => t.isDuplicate);
  const totalCredits = credits.reduce((sum, t) => sum + t.amountCents, 0);
  const totalDebits = debits.reduce((sum, t) => sum + t.amountCents, 0);

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
        <Upload className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium">Import réussi</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Transactions :</span>{" "}
          <span className="font-medium">{result.transactionCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Crédits :</span>{" "}
          <span className="font-medium text-green-600 dark:text-green-400">
            {credits.length} ({formatAmount(totalCredits)})
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Débits :</span>{" "}
          <span className="font-medium text-red-600 dark:text-red-400">
            {debits.length} ({formatAmount(totalDebits)})
          </span>
        </div>
        {duplicates.length > 0 && (
          <div>
            <span className="text-muted-foreground">Doublons signalés :</span>{" "}
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {duplicates.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
