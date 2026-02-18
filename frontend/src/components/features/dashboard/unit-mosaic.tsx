"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEntityUnits } from "@/hooks/use-units";
import { useLeases } from "@/hooks/use-leases";
import { useRentCalls } from "@/hooks/use-rent-calls";
import { useUnpaidRentCalls } from "@/hooks/use-unpaid-rent-calls";
import { UNIT_TYPE_LABELS } from "@/lib/constants/unit-types";
import { getMonthOptions } from "@/lib/month-options";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { UnitWithPropertyData } from "@/lib/api/units-api";
import type { RentCallData } from "@/lib/api/rent-calls-api";

interface UnitMosaicProps {
  entityId: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
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

const STATUS_LABELS: Record<string, string> = {
  unpaid: "Impayé",
  paid: "Payé",
  partial: "Partiellement payé",
  sent: "Envoyé",
  occupied: "Occupé",
  vacant: "Vacant",
};

const STATUS_COLORS: Record<string, string> = {
  unpaid: "bg-red-500",
  paid: "bg-green-500",
  partial: "bg-amber-500",
  sent: "bg-orange-400",
  vacant: "bg-muted-foreground/40",
};

function UnitMosaicLegend() {
  const items = [
    { key: "paid", label: STATUS_LABELS.paid, color: STATUS_COLORS.paid },
    { key: "partial", label: STATUS_LABELS.partial, color: STATUS_COLORS.partial },
    { key: "sent", label: STATUS_LABELS.sent, color: STATUS_COLORS.sent },
    { key: "unpaid", label: STATUS_LABELS.unpaid, color: STATUS_COLORS.unpaid },
    { key: "vacant", label: STATUS_LABELS.vacant, color: STATUS_COLORS.vacant },
  ];

  return (
    <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Légende des statuts">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-sm ${item.color}`} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function getTileStatus(
  unitId: string,
  unpaidUnitIds: Set<string>,
  paidUnitIds: Set<string>,
  partiallyPaidUnitIds: Set<string>,
  sentUnitIds: Set<string>,
  occupiedUnitIds: Set<string>,
): string {
  if (unpaidUnitIds.has(unitId)) return "unpaid";
  if (paidUnitIds.has(unitId)) return "paid";
  if (partiallyPaidUnitIds.has(unitId)) return "partial";
  if (sentUnitIds.has(unitId)) return "sent";
  if (occupiedUnitIds.has(unitId)) return "occupied";
  return "vacant";
}

function getStatusLabel(status: string): string {
  const label = STATUS_LABELS[status];
  return label ? label.toLowerCase() : status;
}

function getBgClass(status: string): string {
  const classes: Record<string, string> = {
    unpaid: "bg-red-100 dark:bg-red-900/30",
    paid: "bg-green-100 dark:bg-green-900/30",
    partial: "bg-amber-100 dark:bg-amber-900/30",
    sent: "bg-orange-100 dark:bg-orange-900/30",
    occupied: "bg-green-100 dark:bg-green-900/30",
    vacant: "bg-muted",
  };
  return classes[status] ?? "bg-muted";
}

/** @internal Exported for testing */
export function buildTooltipContent(
  unit: UnitWithPropertyData,
  status: string,
  rentCallsByUnitId: Map<string, RentCallData>,
): React.ReactNode {
  if (status === "vacant") {
    return <span>Vacant — Aucun bail actif</span>;
  }

  const rc = rentCallsByUnitId.get(unit.id);
  if (!rc) {
    return <span>Occupé — Aucun appel de loyer</span>;
  }

  const tenantName = rc.tenantCompanyName ?? `${rc.tenantFirstName} ${rc.tenantLastName}`;

  return (
    <div className="space-y-0.5">
      <div>Locataire : {tenantName}</div>
      <div>Loyer : {formatCurrency(rc.totalAmountCents)}</div>
      <div>Statut : {getStatusLabel(status)}</div>
      {status === "partial" && rc.paidAmountCents != null && (
        <div>
          Payé : {formatCurrency(rc.paidAmountCents)} / {formatCurrency(rc.totalAmountCents)}
        </div>
      )}
    </div>
  );
}

export function UnitMosaic({ entityId, selectedMonth, onMonthChange }: UnitMosaicProps) {
  const router = useRouter();
  const { data: units, isLoading, isError } = useEntityUnits(entityId);
  const { data: leases } = useLeases(entityId);
  const tileRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const now = React.useMemo(() => new Date(), []);
  const { data: rentCalls } = useRentCalls(entityId, selectedMonth);
  const { data: unpaidRentCalls } = useUnpaidRentCalls(entityId);

  const monthOptions = React.useMemo(() => getMonthOptions(), []);

  const unpaidUnitIds = React.useMemo(() => {
    if (!unpaidRentCalls) return new Set<string>();
    return new Set(unpaidRentCalls.map((rc) => rc.unitId));
  }, [unpaidRentCalls]);

  const occupiedUnitIds = React.useMemo(() => {
    if (!leases) return new Set<string>();
    return new Set(
      leases
        .filter((l) => !l.endDate || new Date(l.endDate) > now)
        .map((l) => l.unitId),
    );
  }, [leases, now]);

  const paidUnitIds = React.useMemo(() => {
    if (!rentCalls) return new Set<string>();
    return new Set(
      rentCalls
        .filter((rc) => rc.paymentStatus === "paid" || rc.paymentStatus === "overpaid")
        .map((rc) => rc.unitId),
    );
  }, [rentCalls]);

  const partiallyPaidUnitIds = React.useMemo(() => {
    if (!rentCalls) return new Set<string>();
    return new Set(
      rentCalls
        .filter((rc) => rc.paymentStatus === "partial")
        .map((rc) => rc.unitId),
    );
  }, [rentCalls]);

  const sentUnitIds = React.useMemo(() => {
    if (!rentCalls) return new Set<string>();
    return new Set(
      rentCalls
        .filter((rc) => rc.sentAt && !rc.paymentStatus)
        .map((rc) => rc.unitId),
    );
  }, [rentCalls]);

  const rentCallsByUnitId = React.useMemo(() => {
    const map = new Map<string, RentCallData>();
    if (!rentCalls) return map;
    for (const rc of rentCalls) {
      map.set(rc.unitId, rc);
    }
    return map;
  }, [rentCalls]);

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
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label htmlFor="mosaic-month-selector" className="text-sm font-medium text-muted-foreground">
            Mois
          </label>
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger id="mosaic-month-selector" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                    const status = getTileStatus(
                      unit.id,
                      unpaidUnitIds,
                      paidUnitIds,
                      partiallyPaidUnitIds,
                      sentUnitIds,
                      occupiedUnitIds,
                    );
                    const statusLabel = getStatusLabel(status);
                    const bgClass = getBgClass(status);
                    return (
                      <Tooltip key={unit.id}>
                        <TooltipTrigger asChild>
                          <button
                            ref={(el) => {
                              tileRefs.current[idx] = el;
                            }}
                            type="button"
                            role="gridcell"
                            tabIndex={idx === safeIndex ? 0 : -1}
                            className={`flex min-w-[120px] cursor-pointer flex-col items-start rounded-lg ${bgClass} p-3 text-left transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`}
                            onClick={() =>
                              router.push(
                                `/properties/${unit.propertyId}/units/${unit.id}`,
                              )
                            }
                            onFocus={() => setActiveIndex(idx)}
                            aria-label={`${unit.identifier}, ${UNIT_TYPE_LABELS[unit.type] ?? unit.type}, ${statusLabel}`}
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
                        </TooltipTrigger>
                        <TooltipContent>
                          {buildTooltipContent(unit, status, rentCallsByUnitId)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </section>
            ),
          )}
        </div>

        <UnitMosaicLegend />
      </div>
    </TooltipProvider>
  );
}
