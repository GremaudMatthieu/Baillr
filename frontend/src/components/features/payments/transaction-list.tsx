"use client";

import { Badge } from "@/components/ui/badge";

interface TransactionItem {
  id?: string;
  date: string;
  amountCents: number;
  payerName: string | null;
  reference: string | null;
  isDuplicate?: boolean;
}

interface TransactionListProps {
  transactions: TransactionItem[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune transaction à afficher
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Montant</th>
            <th className="pb-2 font-medium">Payeur</th>
            <th className="pb-2 font-medium">Référence</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, index) => (
            <tr
              key={t.id ?? `import-${index}`}
              className="border-b last:border-0"
            >
              <td className="py-2">{formatDate(t.date)}</td>
              <td
                className={`py-2 font-medium ${
                  t.amountCents >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatAmount(t.amountCents)}
              </td>
              <td className="py-2">{t.payerName}</td>
              <td className="py-2 text-muted-foreground">
                {t.reference}
                {t.isDuplicate && (
                  <Badge variant="outline" className="ml-2 text-xs text-orange-600 border-orange-300">
                    Doublon
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
