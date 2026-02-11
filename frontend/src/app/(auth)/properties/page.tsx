"use client";

import Link from "next/link";
import { Building2, Plus, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useProperties } from "@/hooks/use-properties";
import type { PropertyData } from "@/lib/api/properties-api";

function PropertyCard({ property }: { property: PropertyData }) {
  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-start justify-between p-4">
          <div className="space-y-1">
            <p className="font-medium">{property.name}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {property.addressStreet}, {property.addressPostalCode}{" "}
              {property.addressCity}
            </p>
          </div>
          {property.type && (
            <Badge variant="secondary">{property.type}</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PropertiesPage() {
  const { entityId } = useCurrentEntity();
  const { data: properties, isLoading, error } = useProperties(entityId ?? "");

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Biens immobiliers
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour voir vos biens
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
        <h1 className="text-2xl font-bold tracking-tight">
          Biens immobiliers
        </h1>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau bien
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

      {error && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des biens
          </p>
        </div>
      )}

      {!isLoading && !error && (!properties || properties.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucun bien immobilier
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajoutez votre premier bien pour organiser votre patrimoine
          </p>
          <Button asChild className="mt-4">
            <Link href="/properties/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un bien
            </Link>
          </Button>
        </div>
      )}

      {properties && properties.length > 0 && (
        <div className="space-y-4">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
