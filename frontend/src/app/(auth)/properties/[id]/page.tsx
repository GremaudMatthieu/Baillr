"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Pencil, Plus, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { PropertyForm } from "@/components/features/properties/property-form";
import { UNIT_TYPE_LABELS } from "@/lib/constants/unit-types";

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: property, isLoading, error } = useProperty(id);
  const { data: units, isLoading: unitsLoading } = useUnits(id);
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
              <div>
                <Skeleton className="mb-1 h-4 w-16" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div>
                <Skeleton className="mb-1 h-4 w-20" />
                <Skeleton className="h-5 w-64" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Bien introuvable</p>
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
            Modifier le bien
          </h1>
        </div>
        <div className="max-w-2xl">
          <PropertyForm property={property} onCancel={() => setIsEditing(false)} />
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
        {property.type && <Badge variant="secondary">{property.type}</Badge>}
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Détails du bien</CardTitle>
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
              <p className="text-sm font-medium text-muted-foreground">Nom</p>
              <p>{property.name}</p>
            </div>
            {property.type && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <p>{property.type}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Adresse
              </p>
              <p className="flex items-start gap-1">
                <MapPin
                  className="mt-0.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {property.addressStreet}
                  {property.addressComplement && (
                    <>
                      <br />
                      {property.addressComplement}
                    </>
                  )}
                  <br />
                  {property.addressPostalCode} {property.addressCity},{" "}
                  {property.addressCountry}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Lots</CardTitle>
            <Button asChild size="sm">
              <Link href={`/properties/${id}/units/new`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nouveau lot
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {unitsLoading && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            )}

            {!unitsLoading && (!units || units.length === 0) && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Aucun lot. Ajoutez votre premier lot.
                </p>
                <Button asChild size="sm">
                  <Link href={`/properties/${id}/units/new`}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Ajouter un lot
                  </Link>
                </Button>
              </div>
            )}

            {!unitsLoading && units && units.length > 0 && (
              <div className="space-y-3">
                {units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/properties/${id}/units/${unit.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{unit.identifier}</span>
                        <Badge variant="secondary">
                          {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {unit.floor !== null && (
                          <span>Étage {unit.floor}</span>
                        )}
                        <span>{unit.surfaceArea} m²</span>
                        {Array.isArray(unit.billableOptions) &&
                          unit.billableOptions.length > 0 && (
                            <Badge variant="outline">
                              {unit.billableOptions.length} option
                              {unit.billableOptions.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
