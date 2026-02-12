"use client";

import Link from "next/link";
import { FileText, Plus, Calendar, Euro } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useLeases } from "@/hooks/use-leases";
import { useTenants } from "@/hooks/use-tenants";
import type { LeaseData } from "@/lib/api/leases-api";
import type { TenantData } from "@/lib/api/tenants-api";

function formatRent(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function LeaseCard({
  lease,
  tenantMap,
}: {
  lease: LeaseData;
  tenantMap: Map<string, TenantData>;
}) {
  const tenant = tenantMap.get(lease.tenantId);
  const tenantName = tenant
    ? `${tenant.firstName} ${tenant.lastName}`
    : "Locataire inconnu";

  return (
    <Link href={`/leases/${lease.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-start justify-between p-4">
          <div className="space-y-1">
            <p className="font-medium">{tenantName}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              Début : {formatDate(lease.startDate)}
            </p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Euro className="h-3.5 w-3.5" aria-hidden="true" />
              {formatRent(lease.rentAmountCents)} / mois
            </p>
          </div>
          <Badge variant="secondary">{lease.revisionIndexType}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function LeasesPage() {
  const { entityId } = useCurrentEntity();
  const { data: leases, isLoading, isError } = useLeases(entityId ?? "");
  const { data: tenants } = useTenants(entityId ?? "");

  const tenantMap = new Map(
    (tenants ?? []).map((t) => [t.id, t]),
  );

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Baux</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour voir vos baux
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Baux</h1>
        <Button asChild>
          <Link href="/leases/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau bail
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des baux
          </p>
        </div>
      )}

      {!isLoading && !isError && (!leases || leases.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucun bail
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez votre premier bail pour commencer
          </p>
          <Button asChild className="mt-4">
            <Link href="/leases/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer un bail
            </Link>
          </Button>
        </div>
      )}

      {leases && leases.length > 0 && (
        <div className="space-y-4">
          {leases.map((lease) => (
            <LeaseCard key={lease.id} lease={lease} tenantMap={tenantMap} />
          ))}
        </div>
      )}
    </div>
  );
}
