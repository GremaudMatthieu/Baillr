"use client";

import Link from "next/link";
import { Building2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEntities } from "@/hooks/use-entities";
import { EntityCard } from "./entity-card";

export function EntityList() {
  const { data: entities, isLoading, error } = useEntities();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">
          Erreur lors du chargement des entités
        </p>
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aucune entité créée
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Créez votre première entité pour commencer
        </p>
        <Button asChild className="mt-4">
          <Link href="/entities/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer une entité
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}
