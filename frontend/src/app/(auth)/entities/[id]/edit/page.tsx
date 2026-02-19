"use client";

import { use } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEntity } from "@/hooks/use-entities";
import { EntityForm } from "@/components/features/entities/entity-form";
import { LatePaymentDelaySettings } from "@/components/features/entities/late-payment-delay-settings";
import { AlertPreferencesForm } from "@/components/features/alert-preferences/alert-preferences-form";

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

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold">Paramètres</h2>
          <LatePaymentDelaySettings
            entityId={id}
            currentDelay={entity.latePaymentDelayDays}
          />
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="mb-4 text-lg font-semibold">Alertes email</h2>
          <AlertPreferencesForm entityId={id} />
        </div>

        <div className="mt-8 border-t pt-6">
          <Button variant="outline" asChild>
            <Link href={`/entities/${id}/bank-accounts`}>
              <Landmark className="h-4 w-4" aria-hidden="true" />
              Comptes bancaires
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
