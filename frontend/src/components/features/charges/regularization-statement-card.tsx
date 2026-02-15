"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StatementData } from "@/lib/api/charge-regularization-api";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format-currency";

function formatDateFR(isoDate: string): string {
  if (isoDate.includes("/")) return isoDate;
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

interface RegularizationStatementCardProps {
  statement: StatementData;
  onDownloadPdf: (leaseId: string) => void;
  isDownloading: boolean;
  downloadingLeaseId: string | null;
}

export function RegularizationStatementCard({
  statement,
  onDownloadPdf,
  isDownloading,
  downloadingLeaseId,
}: RegularizationStatementCardProps) {
  const isDownloadingThis =
    isDownloading && downloadingLeaseId === statement.leaseId;

  const balanceType =
    statement.balanceCents > 0
      ? "complement"
      : statement.balanceCents < 0
        ? "trop-percu"
        : "zero";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {statement.tenantName} — {statement.unitIdentifier}
          </CardTitle>
          <Badge
            variant={
              balanceType === "complement"
                ? "destructive"
                : balanceType === "trop-percu"
                  ? "default"
                  : "secondary"
            }
          >
            {balanceType === "complement"
              ? "Complément"
              : balanceType === "trop-percu"
                ? "Trop-perçu"
                : "Solde nul"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Occupation : du {formatDateFR(statement.occupancyStart)} au{" "}
          {formatDateFR(statement.occupancyEnd)} ({statement.occupiedDays} jours sur{" "}
          {statement.daysInYear})
        </p>
      </CardHeader>
      <CardContent>
        {/* Charges breakdown table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Catégorie</th>
                <th className="pb-2 text-right font-medium">Charge totale</th>
                <th className="pb-2 text-right font-medium">Part locataire</th>
                <th className="pb-2 text-right font-medium">Mode</th>
              </tr>
            </thead>
            <tbody>
              {statement.charges.map((charge) => (
                <tr key={charge.chargeCategoryId} className="border-b">
                  <td className="py-2">{charge.label}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(charge.totalChargeCents)}
                  </td>
                  <td className="py-2 text-right">
                    {formatCurrency(charge.tenantShareCents)}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">
                    {charge.isWaterByConsumption ? "Conso." : "Prorata"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 space-y-2 border-t pt-3">
          <div className="flex justify-between text-sm font-medium">
            <span>Total charges locataire</span>
            <span>{formatCurrency(statement.totalShareCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Provisions versées</span>
            <span>{formatCurrency(statement.totalProvisionsPaidCents)}</span>
          </div>
          <div
            className={cn(
              "flex justify-between text-sm font-bold pt-2 border-t",
              balanceType === "complement" && "text-destructive",
              balanceType === "trop-percu" && "text-green-600 dark:text-green-400",
            )}
          >
            <span>
              {balanceType === "complement"
                ? "Complément à régler"
                : balanceType === "trop-percu"
                  ? "Trop-perçu à restituer"
                  : "Solde"}
            </span>
            <span>{formatCurrency(Math.abs(statement.balanceCents))}</span>
          </div>
        </div>

        {/* Download PDF button */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPdf(statement.leaseId)}
            disabled={isDownloadingThis}
          >
            {isDownloadingThis ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Télécharger PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
