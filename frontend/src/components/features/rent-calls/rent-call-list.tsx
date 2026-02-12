"use client";

import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RentCallData } from "@/lib/api/rent-calls-api";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

interface RentCallListProps {
  rentCalls: RentCallData[];
  tenantNames: Map<string, string>;
  unitIdentifiers: Map<string, string>;
}

export function RentCallList({
  rentCalls,
  tenantNames,
  unitIdentifiers,
}: RentCallListProps) {
  if (rentCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aucun appel de loyer
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Générez les appels de loyer pour ce mois
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rentCalls.map((rc) => (
        <Card key={rc.id}>
          <CardContent className="flex items-start justify-between p-4">
            <div className="space-y-1">
              <p className="font-medium">
                {tenantNames.get(rc.tenantId) ?? "Locataire inconnu"}
              </p>
              <p className="text-sm text-muted-foreground">
                {unitIdentifiers.get(rc.unitId) ?? "Lot inconnu"}
              </p>
              {rc.billingLines.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Loyer : {formatAmount(rc.rentAmountCents)}
                  </p>
                  {rc.billingLines.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {line.label} : {formatAmount(line.amountCents)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-lg font-semibold tabular-nums">
                {formatAmount(rc.totalAmountCents)}
              </p>
              {rc.isProRata && (
                <Badge variant="secondary">Pro-rata</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
