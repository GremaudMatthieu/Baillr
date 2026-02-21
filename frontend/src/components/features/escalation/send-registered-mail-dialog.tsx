"use client";

import { useState } from "react";
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
import { Loader2, Send } from "lucide-react";

interface SendRegisteredMailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCentsTtc: number;
  costCentsHt: number;
  isSending: boolean;
  onConfirm: () => void;
  error: string | null;
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function SendRegisteredMailDialog({
  open,
  onOpenChange,
  costCentsTtc,
  costCentsHt,
  isSending,
  onConfirm,
  error,
}: SendRegisteredMailDialogProps) {
  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSending) return;
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Envoyer en lettre recommandée électronique
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                La mise en demeure sera envoyée par lettre recommandée
                électronique (LRE) via AR24, avec accusé de réception.
              </p>
              <div className="rounded-md border p-3">
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-muted-foreground">Coût HT</dt>
                  <dd className="text-right font-medium">
                    {formatEuros(costCentsHt)}
                  </dd>
                  <dt className="text-muted-foreground">Coût TTC</dt>
                  <dd className="text-right font-medium">
                    {formatEuros(costCentsTtc)}
                  </dd>
                </dl>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce montant sera facturé sur votre compte AR24.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSending}>
            {isSending ? (
              <Loader2
                className="mr-1 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send className="mr-1 h-4 w-4" aria-hidden="true" />
            )}
            Confirmer l&apos;envoi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
