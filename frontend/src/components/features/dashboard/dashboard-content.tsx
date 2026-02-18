"use client";

import * as React from "react";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { getCurrentMonth } from "@/lib/month-options";
import { KpiTiles } from "./kpi-tiles";
import { UnitMosaic } from "./unit-mosaic";
import { UnitMosaicPlaceholder } from "./unit-mosaic-placeholder";
import { TreasuryChart } from "./treasury-chart";

export function DashboardContent() {
  const { entityId } = useCurrentEntity();
  const resolvedEntityId = entityId ?? "";
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonth);

  return (
    <div className="space-y-6">
      {resolvedEntityId ? (
        <KpiTiles entityId={resolvedEntityId} selectedMonth={selectedMonth} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-24 min-w-[10rem] flex-1 shrink-0 rounded-lg border-2 border-dashed border-muted-foreground/25"
            />
          ))}
        </div>
      )}
      {resolvedEntityId ? (
        <TreasuryChart entityId={resolvedEntityId} />
      ) : (
        <div className="h-[380px] rounded-lg border-2 border-dashed border-muted-foreground/25" />
      )}
      {resolvedEntityId ? (
        <UnitMosaic
          entityId={resolvedEntityId}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      ) : (
        <UnitMosaicPlaceholder />
      )}
    </div>
  );
}
