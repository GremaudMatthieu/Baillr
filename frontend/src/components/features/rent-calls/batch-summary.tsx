"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

interface BatchSummaryProps {
  generated: number;
  totalAmountCents: number;
  exceptions: string[];
}

export function BatchSummary({
  generated,
  totalAmountCents,
  exceptions,
}: BatchSummaryProps) {
  return (
    <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Génération terminée
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="font-medium tabular-nums">
            {generated} appel{generated > 1 ? "s" : ""} de loyer
          </span>{" "}
          généré{generated > 1 ? "s" : ""}
        </p>
        <p>
          Montant total :{" "}
          <span className="font-medium tabular-nums">
            {formatAmount(totalAmountCents)}
          </span>
        </p>
        {exceptions.length > 0 && (
          <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="flex items-center gap-1 text-sm font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Avertissements
            </p>
            <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
              {exceptions.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
