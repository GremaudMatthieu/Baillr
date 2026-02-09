"use client";

import { use } from "react";
import { useEntity } from "@/hooks/use-entities";
import { EntityForm } from "@/components/features/entities/entity-form";

export default function EditEntityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: entity, isLoading, error } = useEntity(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Entité introuvable</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Modifier l&apos;entité
      </h1>
      <div className="max-w-2xl">
        <EntityForm entity={entity} />
      </div>
    </div>
  );
}
