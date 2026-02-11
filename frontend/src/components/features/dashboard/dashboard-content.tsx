"use client";

import { useCurrentEntity } from "@/hooks/use-current-entity";
import { KpiTilesPlaceholder } from "./kpi-tiles-placeholder";
import { UnitMosaic } from "./unit-mosaic";
import { UnitMosaicPlaceholder } from "./unit-mosaic-placeholder";

export function DashboardContent() {
  const { entityId } = useCurrentEntity();
  const resolvedEntityId = entityId ?? "";

  return (
    <div className="space-y-6">
      <KpiTilesPlaceholder />
      {resolvedEntityId ? (
        <UnitMosaic entityId={resolvedEntityId} />
      ) : (
        <UnitMosaicPlaceholder />
      )}
    </div>
  );
}
