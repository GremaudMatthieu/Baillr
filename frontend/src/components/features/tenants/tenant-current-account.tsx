"use client";

import { Badge } from "@/components/ui/badge";
import type { AccountEntryData } from "@/lib/api/account-entries-api";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

interface TenantCurrentAccountProps {
  entries: AccountEntryData[];
  balanceCents: number;
}

export function TenantCurrentAccount({
  entries,
  balanceCents,
}: TenantCurrentAccountProps) {
  const isDebit = balanceCents < 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">
          Solde actuel :
        </span>
        <Badge
          variant={isDebit ? "destructive" : "default"}
          aria-label={`Solde : ${formatAmount(balanceCents)}`}
        >
          {formatAmount(balanceCents)}
        </Badge>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucune opération enregistrée pour ce locataire
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table role="table" className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">
                  Date
                </th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">
                  Description
                </th>
                <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">
                  Débit
                </th>
                <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">
                  Crédit
                </th>
                <th className="pb-2 text-right font-medium text-muted-foreground">
                  Solde
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 tabular-nums">
                    {formatDate(entry.entryDate)}
                  </td>
                  <td className="py-2 pr-4">{entry.description}</td>
                  <td className="py-2 pr-4 text-right tabular-nums text-red-600 dark:text-red-400">
                    {entry.type === "debit" ? formatAmount(entry.amountCents) : ""}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-green-600 dark:text-green-400">
                    {entry.type === "credit" ? formatAmount(entry.amountCents) : ""}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums font-medium ${
                      entry.balanceCents < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {formatAmount(entry.balanceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
