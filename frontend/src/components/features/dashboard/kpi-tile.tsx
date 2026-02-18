import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface KpiTileProps {
  label: string;
  value: string;
  trend: number | null;
  trendLabel?: string;
  icon: LucideIcon;
  isPositiveGood?: boolean;
  loading?: boolean;
}

function getTrendColor(trend: number, isPositiveGood: boolean): string {
  if (trend === 0) return "text-muted-foreground";
  const isGood = isPositiveGood ? trend > 0 : trend < 0;
  return isGood
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

function TrendIndicator({
  trend,
  trendLabel,
  isPositiveGood,
}: {
  trend: number | null;
  trendLabel?: string;
  isPositiveGood: boolean;
}) {
  if (trend === null) {
    return null;
  }

  if (trend === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden="true" />
        {trendLabel && <span>{trendLabel}</span>}
      </span>
    );
  }

  const colorClass = getTrendColor(trend, isPositiveGood);
  const TrendIcon = trend > 0 ? ArrowUp : ArrowDown;
  const ariaLabel = trend > 0 ? "En hausse" : "En baisse";

  return (
    <span
      className={`flex items-center gap-0.5 text-xs ${colorClass}`}
      aria-label={ariaLabel}
    >
      <TrendIcon className="h-3 w-3" aria-hidden="true" />
      {trendLabel && <span>{trendLabel}</span>}
    </span>
  );
}

export function KpiTile({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  isPositiveGood = true,
  loading = false,
}: KpiTileProps) {
  if (loading) {
    return (
      <Card className="min-w-[10rem] flex-1 shrink-0 py-3">
        <CardContent className="px-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-20" />
          <Skeleton className="mt-1 h-3 w-14" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-[10rem] flex-1 shrink-0 py-3">
      <CardContent className="px-4">
        <div className="flex items-center gap-1.5">
          <Icon
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            {label}
          </p>
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        <div className="mt-1 h-4">
          <TrendIndicator
            trend={trend}
            trendLabel={trendLabel}
            isPositiveGood={isPositiveGood}
          />
        </div>
      </CardContent>
    </Card>
  );
}
