import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/format-currency";
import { OPERATION_TYPE_LABELS } from "@/lib/constants/operation-types";
import type { AccountEntryWithTenant } from "@/lib/api/accounting-api";

interface AccountBookTableProps {
  entries: AccountEntryWithTenant[];
}

const CATEGORY_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  rent_call: "default",
  payment: "secondary",
  overpayment_credit: "outline",
  charge_regularization: "outline",
  adjustment: "destructive",
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  payment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

function formatDate(dateStr: string): string {
  // Parse as UTC to avoid timezone offset issues with midnight dates
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTenantName(tenant: AccountEntryWithTenant["tenant"]): string {
  if (tenant.type === "company" && tenant.companyName) {
    return tenant.companyName;
  }
  return `${tenant.firstName} ${tenant.lastName}`;
}

export function AccountBookTable({ entries }: AccountBookTableProps) {
  return (
    <>
      {/* Desktop/Tablet table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Livre de comptes">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">
                Locataire
              </th>
              <th className="px-4 py-3 text-right font-medium tabular-nums">
                Débit
              </th>
              <th className="px-4 py-3 text-right font-medium tabular-nums">
                Crédit
              </th>
              <th className="px-4 py-3 text-right font-medium tabular-nums">
                Solde
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDate(entry.entryDate)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <Badge
                    variant={
                      CATEGORY_BADGE_VARIANT[entry.category] ?? "default"
                    }
                    className={CATEGORY_BADGE_CLASS[entry.category] ?? ""}
                  >
                    {OPERATION_TYPE_LABELS[entry.category] ?? entry.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">{entry.description}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {formatTenantName(entry.tenant)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-red-600 dark:text-red-400">
                  {entry.type === "debit"
                    ? formatCurrency(entry.amountCents)
                    : ""}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                  {entry.type === "credit"
                    ? formatCurrency(entry.amountCents)
                    : ""}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-medium ${
                    entry.balanceCents < 0
                      ? "text-red-600 dark:text-red-400"
                      : ""
                  }`}
                >
                  {formatCurrency(entry.balanceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDate(entry.entryDate)}
              </span>
              <Badge
                variant={
                  CATEGORY_BADGE_VARIANT[entry.category] ?? "default"
                }
                className={CATEGORY_BADGE_CLASS[entry.category] ?? ""}
              >
                {OPERATION_TYPE_LABELS[entry.category] ?? entry.category}
              </Badge>
            </div>
            <p className="text-sm">{entry.description}</p>
            <p className="text-xs text-muted-foreground">
              {formatTenantName(entry.tenant)}
            </p>
            <div className="flex justify-between items-center">
              <span
                className={`text-sm font-medium tabular-nums ${
                  entry.type === "debit"
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {entry.type === "debit" ? "−" : "+"}{" "}
                {formatCurrency(entry.amountCents)}
              </span>
              <span
                className={`text-sm font-medium tabular-nums ${
                  entry.balanceCents < 0
                    ? "text-red-600 dark:text-red-400"
                    : ""
                }`}
              >
                Solde : {formatCurrency(entry.balanceCents)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
