"use client";

import type { WaterDistributionData } from "@/lib/api/water-meter-api";
import type { UnitData } from "@/lib/api/units-api";
import { cn } from "@/lib/utils";

interface WaterDistributionSummaryProps {
  distribution: WaterDistributionData;
  units: UnitData[];
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function WaterDistributionSummary({
  distribution,
  units,
}: WaterDistributionSummaryProps) {
  if (distribution.distributions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucune répartition disponible.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 font-medium text-muted-foreground">
              Lot
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Consommation (m³)
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Part (%)
            </th>
            <th className="text-right py-2 px-2 font-medium text-muted-foreground">
              Montant
            </th>
          </tr>
        </thead>
        <tbody>
          {distribution.distributions.map((d) => {
            const unit = units.find((u) => u.id === d.unitId);
            const percentage =
              d.consumption != null && distribution.totalConsumption > 0
                ? ((d.consumption / distribution.totalConsumption) * 100).toFixed(
                    1,
                  )
                : "—";

            return (
              <tr key={d.unitId} className="border-b border-border/50">
                <td className="py-2 px-2">
                  <span className="font-medium">
                    {unit?.identifier ?? d.unitId}
                  </span>
                  {!d.isMetered && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (non mesuré)
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {d.consumption != null ? d.consumption : "—"}
                </td>
                <td className="py-2 px-2 text-right tabular-nums">
                  {percentage === "—" ? "—" : `${percentage} %`}
                </td>
                <td
                  className={cn(
                    "py-2 px-2 text-right tabular-nums font-medium",
                    d.amountCents === 0 && "text-muted-foreground",
                  )}
                >
                  {formatCurrency(d.amountCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-bold">
            <td className="py-2 px-2">TOTAL</td>
            <td className="py-2 px-2 text-right tabular-nums">
              {distribution.totalConsumption}
            </td>
            <td className="py-2 px-2 text-right tabular-nums">100 %</td>
            <td className="py-2 px-2 text-right tabular-nums">
              {formatCurrency(distribution.totalWaterCents)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Répartition proportionnelle à la consommation individuelle. Les lots non
        mesurés ne se voient pas attribuer de charges d&apos;eau.
      </p>
    </div>
  );
}
