"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntityUnits } from "@/hooks/use-units";
import { UNIT_TYPE_LABELS } from "@/lib/constants/unit-types";
import type { UnitWithPropertyData } from "@/lib/api/units-api";

interface UnitMosaicProps {
  entityId: string;
}

function groupByProperty(
  units: UnitWithPropertyData[],
): Map<string, { propertyName: string; units: UnitWithPropertyData[] }> {
  const groups = new Map<
    string,
    { propertyName: string; units: UnitWithPropertyData[] }
  >();

  for (const unit of units) {
    const existing = groups.get(unit.propertyId);
    if (existing) {
      existing.units.push(unit);
    } else {
      groups.set(unit.propertyId, {
        propertyName: unit.propertyName,
        units: [unit],
      });
    }
  }

  return groups;
}

function UnitMosaicSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function UnitMosaicEmpty() {
  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25"
      aria-label="Mosaique des lots"
    >
      <Building2
        className="h-10 w-10 text-muted-foreground/50"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        Aucun lot configure
      </p>
      <p className="mt-1 text-xs text-muted-foreground/75">
        Vos lots apparaitront ici une fois crees
      </p>
    </div>
  );
}

function UnitMosaicError() {
  return (
    <div
      className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/25"
      role="alert"
    >
      <AlertCircle
        className="h-10 w-10 text-destructive/50"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-destructive">
        Impossible de charger les lots
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Verifiez votre connexion et rechargez la page
      </p>
    </div>
  );
}

function formatFloorAndSurface(
  floor: number | null,
  surfaceArea: number,
): string {
  const parts: string[] = [];
  if (floor !== null) {
    parts.push(`Etage ${floor}`);
  }
  if (surfaceArea > 0) {
    parts.push(`${surfaceArea} m\u00B2`);
  }
  return parts.join(" \u00B7 ");
}

export function UnitMosaic({ entityId }: UnitMosaicProps) {
  const router = useRouter();
  const { data: units, isLoading, isError } = useEntityUnits(entityId);
  const tileRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (isLoading) {
    return <UnitMosaicSkeleton />;
  }

  if (isError) {
    return <UnitMosaicError />;
  }

  if (!units || units.length === 0) {
    return <UnitMosaicEmpty />;
  }

  const groups = groupByProperty(units);
  const safeIndex = Math.min(activeIndex, units.length - 1);
  const unitIndexMap = new Map(units.map((u, i) => [u.id, i]));

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!units) return;
    const total = units.length;
    const current = safeIndex;
    let nextIndex = current;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        nextIndex = (current + 1) % total;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        nextIndex = (current - 1 + total) % total;
        break;
      case "Home":
        e.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        e.preventDefault();
        nextIndex = total - 1;
        break;
      default:
        return;
    }

    setActiveIndex(nextIndex);
    tileRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className="space-y-6"
      role="grid"
      aria-label="Mosaique des lots"
      onKeyDown={handleGridKeyDown}
    >
      {Array.from(groups.entries()).map(
        ([propertyId, { propertyName, units: propertyUnits }]) => (
          <section key={propertyId} aria-label={propertyName}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              {propertyName}
            </h3>
            <div
              className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              role="row"
            >
              {propertyUnits.map((unit) => {
                const idx = unitIndexMap.get(unit.id) ?? 0;
                return (
                  <button
                    key={unit.id}
                    ref={(el) => {
                      tileRefs.current[idx] = el;
                    }}
                    type="button"
                    role="gridcell"
                    tabIndex={idx === safeIndex ? 0 : -1}
                    className="flex min-w-[120px] cursor-pointer flex-col items-start rounded-lg bg-muted p-3 text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={() =>
                      router.push(
                        `/properties/${unit.propertyId}/units/${unit.id}`,
                      )
                    }
                    onFocus={() => setActiveIndex(idx)}
                    aria-label={`${unit.identifier}, ${UNIT_TYPE_LABELS[unit.type] ?? unit.type}, vacant`}
                  >
                    <span className="text-sm font-medium">
                      {unit.identifier}
                    </span>
                    <Badge variant="secondary" className="mt-1">
                      {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
                    </Badge>
                    <span className="mt-1 text-xs text-muted-foreground">
                      {formatFloorAndSurface(unit.floor, unit.surfaceArea)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
