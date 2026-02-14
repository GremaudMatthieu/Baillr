"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useInseeIndices, useRecordInseeIndex } from "@/hooks/use-insee-indices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { InseeIndexForm } from "@/components/features/indices/insee-index-form";
import { InseeIndexList } from "@/components/features/indices/insee-index-list";
import type { InseeIndexFormData } from "@/components/features/indices/insee-index-schema";

export default function IndicesPage() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Indices INSEE</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour gérer vos indices
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <IndicesPageContent entityId={entityId} />;
}

function IndicesPageContent({ entityId }: { entityId: string }) {
  const { data: indices = [], isLoading } = useInseeIndices(entityId);
  const recordMutation = useRecordInseeIndex(entityId);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (data: InseeIndexFormData) => {
    recordMutation.mutate(
      { id: crypto.randomUUID(), ...data },
      { onSuccess: () => setFormKey((k) => k + 1) },
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Indices INSEE</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Enregistrer un indice</CardTitle>
          </CardHeader>
          <CardContent>
            <InseeIndexForm
              key={formKey}
              onSubmit={handleSubmit}
              isSubmitting={recordMutation.isPending}
            />
            {recordMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                {recordMutation.error instanceof Error &&
                !recordMutation.error.message.startsWith("Request failed:")
                  ? recordMutation.error.message
                  : "Erreur lors de l\u0027enregistrement. Veuillez réessayer."}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indices enregistrés</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Chargement…
              </p>
            ) : (
              <InseeIndexList indices={indices} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
