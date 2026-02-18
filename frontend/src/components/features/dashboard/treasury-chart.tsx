"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTreasuryChart } from "@/hooks/use-rent-calls";
import { formatCurrency } from "@/lib/utils/format-currency";
import { Skeleton } from "@/components/ui/skeleton";

interface TreasuryChartProps {
  entityId: string;
}

const MONTHS_OPTIONS = [6, 12, 24] as const;

function formatMonthLabel(month: string): string {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCompactEur(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) {
    const k = Math.round(euros / 100) / 10;
    return `${k}k €`;
  }
  return `${Math.round(euros)} €`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
    name: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function TreasuryChart({ entityId }: TreasuryChartProps) {
  const [months, setMonths] = React.useState<number>(12);
  const { data, isLoading } = useTreasuryChart(entityId, months);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Trésorerie</h3>
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          Aucune donnée financière disponible
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));

  return (
    <div className="rounded-lg border bg-card p-6 [--chart-called:#99f6e4] [--chart-received:#0d9488] dark:[--chart-called:#115e59] dark:[--chart-received:#2dd4bf]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Trésorerie</h3>
        <div className="flex gap-1" role="group" aria-label="Période">
          {MONTHS_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setMonths(opt)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                months === opt
                  ? "bg-teal-600 text-white dark:bg-teal-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              aria-pressed={months === opt}
            >
              {opt} mois
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tickFormatter={formatCompactEur}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="calledCents"
            name="Loyers appelés"
            fill="var(--chart-called)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="receivedCents"
            name="Paiements reçus"
            fill="var(--chart-received)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
