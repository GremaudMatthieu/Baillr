"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Loader2, Download } from "lucide-react";

import { useCurrentEntity } from "@/hooks/use-current-entity";
import {
  useInseeIndices,
  useRecordInseeIndex,
  useFetchInseeIndices,
} from "@/hooks/use-insee-indices";
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
  const fetchMutation = useFetchInseeIndices(entityId);
  const [formKey, setFormKey] = useState(0);
  const [fetchMessage, setFetchMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSubmit = (data: InseeIndexFormData) => {
    recordMutation.mutate(
      { id: crypto.randomUUID(), ...data },
      { onSuccess: () => setFormKey((k) => k + 1) },
    );
  };

  const handleFetch = () => {
    setFetchMessage(null);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    fetchMutation.mutate(undefined, {
      onSuccess: (result) => {
        const text =
          result.newIndices === 0 && result.skipped === 0
            ? "Aucun indice disponible sur le service INSEE."
            : `${result.newIndices} nouveaux indices enregistrés, ${result.skipped} déjà présents.`;
        setFetchMessage({ type: "success", text });
        successTimerRef.current = setTimeout(
          () => setFetchMessage(null),
          10_000,
        );
      },
      onError: () => {
        setFetchMessage({
          type: "error",
          text: "Le service INSEE est temporairement indisponible. Saisissez les indices manuellement.",
        });
      },
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Indices INSEE</h1>
        <Button
          onClick={handleFetch}
          disabled={fetchMutation.isPending}
          variant="outline"
        >
          {fetchMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Récupérer les indices INSEE
        </Button>
      </div>

      {fetchMessage && (
        <p
          role="status"
          aria-live="polite"
          className={`mb-4 text-sm ${fetchMessage.type === "error" ? "text-destructive" : "text-green-700 dark:text-green-400"}`}
        >
          {fetchMessage.text}
        </p>
      )}

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
