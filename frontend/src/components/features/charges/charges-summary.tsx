"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ChargeEntryData, ProvisionsData } from "@/lib/api/annual-charges-api";
import type { WaterDistributionData } from "@/lib/api/water-meter-api";
import type { UnitData } from "@/lib/api/units-api";
import { cn } from "@/lib/utils";

interface ChargesSummaryProps {
  charges: ChargeEntryData[];
  provisions: ProvisionsData | null;
  totalChargesCents: number;
  waterDistribution?: WaterDistributionData | null;
  units?: UnitData[];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function isWaterCategory(charge: ChargeEntryData): boolean {
  const label = charge.label.toLowerCase();
  return (
    label.includes("eau") ||
    charge.chargeCategoryId?.toLowerCase().includes("water") === true
  );
}

function findProvisionForCharge(
  charge: ChargeEntryData,
  details: ProvisionsData["details"],
): ProvisionsData["details"][0] | undefined {
  // Match by chargeCategoryId when available
  if (charge.chargeCategoryId) {
    return details.find((d) => d.chargeCategoryId === charge.chargeCategoryId);
  }
  // Fallback: match by label for legacy data
  return details.find((d) => d.categoryLabel === charge.label);
}

export function ChargesSummary({
  charges,
  provisions,
  totalChargesCents,
  waterDistribution,
  units,
}: ChargesSummaryProps) {
  const [expandedWater, setExpandedWater] = useState(false);

  if (charges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune charge enregistrée pour cet exercice.
      </p>
    );
  }

  const totalProvisionsCents = provisions?.totalProvisionsCents ?? 0;
  const differenceCents = totalChargesCents - totalProvisionsCents;

  // Build comparison rows: match charges to provisions by chargeCategoryId
  const matchedProvisionKeys = new Set<string>();

  const rows = charges.map((charge) => {
    const provisionDetail = provisions
      ? findProvisionForCharge(charge, provisions.details)
      : undefined;

    if (provisionDetail) {
      const key = provisionDetail.chargeCategoryId
        ? `cat:${provisionDetail.chargeCategoryId}`
        : `label:${provisionDetail.categoryLabel}`;
      matchedProvisionKeys.add(key);
    }

    return {
      label: charge.label,
      chargeCents: charge.amountCents,
      provisionCents: provisionDetail?.totalCents ?? 0,
      isWater: isWaterCategory(charge),
    };
  });

  // Add provisions not matched to any charge
  if (provisions) {
    for (const detail of provisions.details) {
      const key = detail.chargeCategoryId
        ? `cat:${detail.chargeCategoryId}`
        : `label:${detail.categoryLabel}`;
      if (!matchedProvisionKeys.has(key)) {
        rows.push({
          label: detail.categoryLabel,
          chargeCents: 0,
          provisionCents: detail.totalCents,
          isWater: false,
        });
      }
    }
  }

  const hasWaterDetail =
    waterDistribution &&
    waterDistribution.distributions.length > 0 &&
    units &&
    units.length > 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">
              Catégorie
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Charges réelles
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Provisions
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Différence
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const diff = row.chargeCents - row.provisionCents;
            const canExpand = row.isWater && hasWaterDetail;

            return (
              <Fragment key={`${row.label}-${i}`}>
                <tr
                  className={cn(
                    "border-b border-border/50",
                    canExpand && "cursor-pointer hover:bg-muted/50",
                  )}
                  onClick={
                    canExpand
                      ? () => setExpandedWater((prev) => !prev)
                      : undefined
                  }
                >
                  <td className="py-2 px-2">
                    <span className="flex items-center gap-1">
                      {canExpand &&
                        (expandedWater ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ))}
                      {row.label}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {formatCurrency(row.chargeCents)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {formatCurrency(row.provisionCents)}
                  </td>
                  <td
                    className={cn(
                      "py-2 px-2 text-right tabular-nums font-medium",
                      diff > 0 && "text-destructive dark:text-red-400",
                      diff < 0 && "text-green-600 dark:text-green-400",
                    )}
                  >
                    {diff > 0 ? "+" : ""}
                    {formatCurrency(diff)}
                  </td>
                </tr>
                {canExpand &&
                  expandedWater &&
                  waterDistribution!.distributions.map((d) => {
                    const unit = units!.find((u) => u.id === d.unitId);
                    return (
                      <tr
                        key={`water-${d.unitId}`}
                        className="border-b border-border/30 bg-muted/30"
                      >
                        <td className="py-1 pl-8 pr-2 text-xs text-muted-foreground">
                          {unit?.identifier ?? d.unitId}
                          {!d.isMetered && " (non mesuré)"}
                          {d.isMetered &&
                            d.consumption != null &&
                            ` — ${d.consumption} m³`}
                        </td>
                        <td className="py-1 px-2 text-right text-xs tabular-nums">
                          {formatCurrency(d.amountCents)}
                        </td>
                        <td className="py-1 px-2" />
                        <td className="py-1 px-2" />
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-bold">
            <td className="py-2 px-2">TOTAL</td>
            <td className="py-2 px-2 text-right tabular-nums">
              {formatCurrency(totalChargesCents)}
            </td>
            <td className="py-2 px-2 text-right tabular-nums">
              {formatCurrency(totalProvisionsCents)}
            </td>
            <td
              className={cn(
                "py-2 px-2 text-right tabular-nums",
                differenceCents > 0 && "text-destructive dark:text-red-400",
                differenceCents < 0 && "text-green-600 dark:text-green-400",
              )}
            >
              {differenceCents > 0 ? "+" : ""}
              {formatCurrency(differenceCents)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        {differenceCents > 0
          ? "Différence positive : le locataire doit un complément."
          : differenceCents < 0
            ? "Différence négative : le locataire a un trop-perçu."
            : "Charges et provisions sont à l'équilibre."}
      </p>
    </div>
  );
}
