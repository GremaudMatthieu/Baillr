"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Euro, FileText, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnit } from "@/hooks/use-units";
import { useLeases } from "@/hooks/use-leases";
import { useTenant } from "@/hooks/use-tenants";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { UnitForm } from "@/components/features/units/unit-form";
import { UNIT_TYPE_LABELS } from "@/lib/constants/unit-types";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import type { LeaseData } from "@/lib/api/leases-api";

function formatRent(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

function LeaseInfo({ lease }: { lease: LeaseData }) {
  const { data: tenant } = useTenant(lease.tenantId);
  const tenantName = tenant
    ? `${tenant.firstName} ${tenant.lastName}`
    : "Chargement…";

  return (
    <Link
      href={`/leases/${lease.id}`}
      className="block rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
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
      <Badge variant="secondary" className="mt-2">
        {REVISION_INDEX_TYPE_LABELS[lease.revisionIndexType] ??
          lease.revisionIndexType}
      </Badge>
    </Link>
  );
}

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id: propertyId, unitId } = use(params);
  const router = useRouter();
  const { entityId } = useCurrentEntity();
  const { data: unit, isLoading, error } = useUnit(unitId);
  const { data: leases } = useLeases(entityId ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const unitLeases = leases?.filter((l) => l.unitId === unitId) ?? [];

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Lot introuvable</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
            aria-label="Annuler la modification"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Modifier le lot
          </h1>
        </div>
        <div className="max-w-2xl">
          <UnitForm
            propertyId={propertyId}
            initialData={unit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  const billableOptions = Array.isArray(unit.billableOptions)
    ? unit.billableOptions
    : [];

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
          {unit.identifier}
        </h1>
        <Badge variant="secondary">
          {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
        </Badge>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Détails du lot</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Modifier
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Identifiant
              </p>
              <p>{unit.identifier}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p>{UNIT_TYPE_LABELS[unit.type] ?? unit.type}</p>
            </div>
            {unit.floor !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Étage
                </p>
                <p>{unit.floor}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Surface
              </p>
              <p>{unit.surfaceArea} m²</p>
            </div>

            {billableOptions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Options facturables
                </p>
                <div className="space-y-1">
                  {billableOptions.map((opt, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{opt.label}</span>
                      <span className="text-muted-foreground">
                        {(opt.amountCents / 100).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Bail</CardTitle>
          </CardHeader>
          <CardContent>
            {unitLeases.length > 0 ? (
              <div className="space-y-3">
                {unitLeases.map((lease) => (
                  <LeaseInfo key={lease.id} lease={lease} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun bail pour ce lot
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
