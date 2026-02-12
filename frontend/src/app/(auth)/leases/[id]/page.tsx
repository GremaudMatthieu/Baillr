"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Euro, Hash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLease } from "@/hooks/use-leases";
import { useTenant } from "@/hooks/use-tenants";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";

function formatRent(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function LeaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: lease, isLoading, isError } = useLease(id);
  const { data: tenant } = useTenant(lease?.tenantId ?? "");

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !lease) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Bail introuvable</p>
      </div>
    );
  }

  const tenantName = tenant
    ? `${tenant.firstName} ${tenant.lastName}`
    : "Chargement…";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Bail — {tenantName}
        </h1>
        <Badge variant="secondary">{lease.revisionIndexType}</Badge>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du bail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Locataire
              </p>
              <p>{tenantName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Date de début
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {formatDate(lease.startDate)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Loyer mensuel
              </p>
              <p className="flex items-center gap-1">
                <Euro className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {formatRent(lease.rentAmountCents)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dépôt de garantie
              </p>
              <p>{formatRent(lease.securityDepositCents)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jour d&apos;échéance
              </p>
              <p className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {lease.monthlyDueDate} du mois
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Indice de révision
              </p>
              <p>
                {REVISION_INDEX_TYPE_LABELS[lease.revisionIndexType] ??
                  lease.revisionIndexType}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
