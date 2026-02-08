import { Card, CardContent } from "@/components/ui/card";

const kpis = [
  { label: "Taux d'encaissement" },
  { label: "Loyers appelés" },
  { label: "Paiements reçus" },
  { label: "Impayés" },
] as const;

export function KpiTilesPlaceholder() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} role="status" aria-label={kpi.label}>
          <Card className="py-3">
            <CardContent>
              <p className="text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">&mdash;</p>
              <div className="mt-1 h-4" aria-hidden="true" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
