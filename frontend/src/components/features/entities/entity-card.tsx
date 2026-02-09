"use client";

import Link from "next/link";
import { Building2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EntityData } from "@/lib/api/entities-api";

const typeLabels: Record<string, string> = {
  sci: "SCI",
  nom_propre: "Nom propre",
};

interface EntityCardProps {
  entity: EntityData;
}

export function EntityCard({ entity }: EntityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Building2
                className="h-5 w-5 text-accent-foreground"
                aria-hidden="true"
              />
            </div>
            <div>
              <CardTitle className="text-base">{entity.name}</CardTitle>
              <CardDescription>
                {typeLabels[entity.type] ?? entity.type}
                {entity.siret && ` — SIRET ${entity.siret}`}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link
              href={`/entities/${entity.id}/edit`}
              aria-label={`Modifier ${entity.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {entity.addressStreet}
          {entity.addressComplement && `, ${entity.addressComplement}`},{" "}
          {entity.addressPostalCode} {entity.addressCity}
        </p>
        {entity.legalInformation && (
          <p className="mt-1 text-sm text-muted-foreground">
            {entity.legalInformation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
