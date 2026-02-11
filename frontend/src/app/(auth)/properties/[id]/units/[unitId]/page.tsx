"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnit } from "@/hooks/use-units";
import { UnitForm } from "@/components/features/units/unit-form";
import { UNIT_TYPE_LABELS } from "@/lib/constants/unit-types";

export default function UnitDetailPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id: propertyId, unitId } = use(params);
  const router = useRouter();
  const { data: unit, isLoading, error } = useUnit(unitId);
  const [isEditing, setIsEditing] = useState(false);

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
      </div>
    </div>
  );
}
