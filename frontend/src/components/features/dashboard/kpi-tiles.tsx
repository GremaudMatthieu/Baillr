"use client";

import * as React from "react";
import {
  Percent,
  Receipt,
  Banknote,
  AlertTriangle,
  TrendingDown,
} from "lucide-react";
import { useDashboardKpis } from "@/hooks/use-rent-calls";
import { KpiTile } from "./kpi-tile";

interface KpiTilesProps {
  entityId: string;
  selectedMonth: string;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

/** Compact currency for KPI tiles: no cents, abbreviate large amounts */
function formatCompactCurrency(cents: number): string {
  const euros = cents / 100;
  const abs = Math.abs(euros);

  if (abs >= 1_000_000) {
    const value = (euros / 1_000_000).toFixed(1).replace(".", ",");
    return `${value} M€`;
  }
  if (abs >= 10_000) {
    const value = (euros / 1_000).toFixed(1).replace(".", ",");
    return `${value} k€`;
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(euros);
}

function formatTrendCompact(cents: number): string {
  const prefix = cents > 0 ? "+" : "";
  return `${prefix}${formatCompactCurrency(cents)}`;
}

function formatTrendPercent(pts: number): string {
  const prefix = pts > 0 ? "+" : pts < 0 ? "-" : "";
  return `${prefix}${Math.abs(pts).toFixed(1).replace(".", ",")} pts`;
}

function formatTrendCount(count: number): string {
  const prefix = count > 0 ? "+" : "";
  return `${prefix}${count}`;
}

export function KpiTiles({ entityId, selectedMonth }: KpiTilesProps) {
  const { data, isLoading, isError } = useDashboardKpis(
    entityId,
    selectedMonth,
  );

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }, (_, i) => (
          <KpiTile
            key={i}
            label=""
            value=""
            trend={null}
            icon={Percent}
            loading
          />
        ))}
      </div>
    );
  }

  const current = data?.currentMonth;
  const previous = data?.previousMonth;

  const collectionRate = current?.collectionRatePercent ?? 0;
  const totalCalled = current?.totalCalledCents ?? 0;
  const totalReceived = current?.totalReceivedCents ?? 0;
  const unpaidCount = current?.unpaidCount ?? 0;
  const outstandingDebt = current?.outstandingDebtCents ?? 0;

  const hasPreviousData =
    previous && (previous.totalCalledCents > 0 || previous.totalReceivedCents > 0);

  const rateTrend = hasPreviousData
    ? collectionRate - (previous?.collectionRatePercent ?? 0)
    : null;
  const calledTrend = hasPreviousData
    ? totalCalled - (previous?.totalCalledCents ?? 0)
    : null;
  const receivedTrend = hasPreviousData
    ? totalReceived - (previous?.totalReceivedCents ?? 0)
    : null;
  const unpaidTrend = hasPreviousData
    ? unpaidCount - (previous?.unpaidCount ?? 0)
    : null;

  const errorValue = "—";

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      <KpiTile
        label="Taux d'encaissement"
        value={isError ? errorValue : formatPercent(collectionRate)}
        trend={rateTrend}
        trendLabel={rateTrend !== null ? formatTrendPercent(rateTrend) : undefined}
        icon={Percent}
        isPositiveGood
      />
      <KpiTile
        label="Loyers appelés"
        value={isError ? errorValue : formatCompactCurrency(totalCalled)}
        trend={calledTrend}
        trendLabel={
          calledTrend !== null ? formatTrendCompact(calledTrend) : undefined
        }
        icon={Receipt}
        isPositiveGood
      />
      <KpiTile
        label="Paiements reçus"
        value={isError ? errorValue : formatCompactCurrency(totalReceived)}
        trend={receivedTrend}
        trendLabel={
          receivedTrend !== null
            ? formatTrendCompact(receivedTrend)
            : undefined
        }
        icon={Banknote}
        isPositiveGood
      />
      <KpiTile
        label="Impayés"
        value={isError ? errorValue : String(unpaidCount)}
        trend={unpaidTrend}
        trendLabel={
          unpaidTrend !== null ? formatTrendCount(unpaidTrend) : undefined
        }
        icon={AlertTriangle}
        isPositiveGood={false}
      />
      {/* Outstanding debt is cross-month (not month-specific), so trend vs previous month is not meaningful */}
      <KpiTile
        label="Encours total"
        value={isError ? errorValue : formatCompactCurrency(outstandingDebt)}
        trend={null}
        icon={TrendingDown}
        isPositiveGood={false}
      />
    </div>
  );
}
