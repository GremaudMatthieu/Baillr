"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format-currency";

interface AccountBookSummaryProps {
  totalBalanceCents: number;
  entryCount: number;
}

export function AccountBookSummary({
  totalBalanceCents,
  entryCount,
}: AccountBookSummaryProps) {
  const isNegative = totalBalanceCents < 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-6 p-4">
        <div>
          <p className="text-sm text-muted-foreground">Solde total</p>
          <p
            className={`text-2xl font-bold tabular-nums ${
              isNegative ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {formatCurrency(totalBalanceCents)}
          </p>
        </div>
        <div className="border-l pl-6">
          <p className="text-sm text-muted-foreground">Écritures</p>
          <p className="text-2xl font-bold tabular-nums">{entryCount}</p>
        </div>
      </CardContent>
    </Card>
  );
}
