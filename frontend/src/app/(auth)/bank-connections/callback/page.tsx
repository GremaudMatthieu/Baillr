"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCompleteBankConnection } from "@/hooks/use-bank-connections";

function BankConnectionCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const entityId = searchParams.get("entityId") ?? "";
  const bankAccountId = searchParams.get("bankAccountId") ?? "";

  const completeMutation = useCompleteBankConnection(entityId);

  const hasAttempted = React.useRef(false);

  React.useEffect(() => {
    if (hasAttempted.current) return;
    if (!entityId || !bankAccountId) return;

    hasAttempted.current = true;
    completeMutation.mutate({ bankAccountId });
  }, [entityId, bankAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!entityId || !bankAccountId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Paramètres manquants
            </CardTitle>
            <CardDescription>
              Les paramètres de retour sont incomplets. Veuillez réessayer la
              connexion depuis la page de votre entité.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completeMutation.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
              Finalisation de la connexion...
            </CardTitle>
            <CardDescription>
              Veuillez patienter pendant que nous enregistrons votre connexion
              bancaire.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (completeMutation.isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
              Échec de la connexion
            </CardTitle>
            <CardDescription>
              {completeMutation.error?.message ??
                "La connexion bancaire n'a pas pu être finalisée. Veuillez réessayer."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() =>
                router.push(`/entities/${entityId}/bank-accounts`)
              }
            >
              Retour aux comptes bancaires
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2
              className="h-5 w-5 text-green-600"
              aria-hidden="true"
            />
            Connexion réussie
          </CardTitle>
          <CardDescription>
            Votre compte bancaire est maintenant connecté. Les transactions
            seront synchronisées automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() =>
              router.push(`/entities/${entityId}/bank-accounts`)
            }
          >
            Retour aux comptes bancaires
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BankConnectionCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BankConnectionCallbackContent />
    </React.Suspense>
  );
}
