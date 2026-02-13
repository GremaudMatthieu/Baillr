"use client";

import { Mail, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

interface SendBatchSummaryProps {
  sent: number;
  failed: number;
  totalAmountCents: number;
  failures: string[];
}

export function SendBatchSummary({
  sent,
  failed,
  totalAmountCents,
  failures,
}: SendBatchSummaryProps) {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
          <Mail className="h-4 w-4" aria-hidden="true" />
          Envoi terminé
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="font-medium tabular-nums">
            {sent} appel{sent > 1 ? "s" : ""} de loyer
          </span>{" "}
          envoyé{sent > 1 ? "s" : ""} par email
        </p>
        {totalAmountCents > 0 && (
          <p>
            Montant total :{" "}
            <span className="font-medium tabular-nums">
              {formatAmount(totalAmountCents)}
            </span>
          </p>
        )}
        {failed > 0 && (
          <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {failed} envoi{failed > 1 ? "s" : ""} échoué{failed > 1 ? "s" : ""}
            </p>
            {failures.length > 0 && (
              <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
                {failures.map((name, index) => (
                  <li key={`${name}-${index}`}>{name}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
