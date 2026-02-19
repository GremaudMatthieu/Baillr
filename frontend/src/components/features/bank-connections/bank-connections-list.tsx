"use client";

import * as React from "react";
import { RefreshCw, Unplug, Loader2, Wifi } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BankConnectionBadge } from "./bank-connection-badge";
import {
  useBankConnections,
  useSyncBankConnection,
  useDisconnectBankConnection,
} from "@/hooks/use-bank-connections";
import type { BankConnectionData } from "@/lib/api/open-banking-api";

interface BankConnectionsListProps {
  entityId: string;
}

export function BankConnectionsList({ entityId }: BankConnectionsListProps) {
  const { data: connections, isLoading, error } = useBankConnections(entityId);
  const syncMutation = useSyncBankConnection(entityId);
  const disconnectMutation = useDisconnectBankConnection(entityId);

  const [disconnectingId, setDisconnectingId] = React.useState<string | null>(
    null,
  );
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  async function handleSync(connectionId: string) {
    setSyncingId(connectionId);
    try {
      await syncMutation.mutateAsync({ connectionId });
    } finally {
      setSyncingId(null);
    }
  }

  function handleDisconnectConfirm() {
    if (disconnectingId) {
      disconnectMutation.mutate(disconnectingId);
      setDisconnectingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-destructive">
          Erreur lors du chargement des connexions bancaires
        </p>
      </div>
    );
  }

  if (!connections || connections.length === 0) {
    return null;
  }

  const disconnectingConnection = connections.find(
    (c) => c.id === disconnectingId,
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Connexions Open Banking
      </h3>

      <ul className="list-none space-y-3" aria-label="Connexions bancaires">
        {connections.map((connection) => (
          <li key={connection.id}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <Wifi
                        className="h-4 w-4 text-accent-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">
                          {connection.institutionName}
                        </CardTitle>
                        <BankConnectionBadge status={connection.status} />
                      </div>
                      <CardDescription className="text-xs">
                        {connection.provider}
                        {connection.lastSyncedAt &&
                          ` — Dernière sync : ${new Date(connection.lastSyncedAt).toLocaleDateString("fr-FR")}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {connection.status === "linked" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleSync(connection.id)}
                        disabled={syncingId === connection.id}
                        aria-label={`Synchroniser ${connection.institutionName}`}
                      >
                        {syncingId === connection.id ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDisconnectingId(connection.id)}
                      aria-label={`Déconnecter ${connection.institutionName}`}
                    >
                      <Unplug className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {connection.status === "expired" && (
                <CardContent className="pt-0">
                  <p className="text-xs text-destructive">
                    Le consentement bancaire a expiré. Reconnectez-vous pour
                    reprendre la synchronisation.
                  </p>
                </CardContent>
              )}
            </Card>
          </li>
        ))}
      </ul>

      <AlertDialog
        open={!!disconnectingId}
        onOpenChange={(open) => !open && setDisconnectingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter la banque</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment déconnecter &quot;
              {disconnectingConnection?.institutionName}&quot; ? La
              synchronisation des transactions sera interrompue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectConfirm}>
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
