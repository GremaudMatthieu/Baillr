"use client";

import { Loader2 } from "lucide-react";
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

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(parseInt(year, 10), parseInt(m, 10) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

interface SendRentCallsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  month: string;
  unsentCount: number;
  missingEmailCount: number;
  submitError?: string | null;
}

export function SendRentCallsDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  month,
  unsentCount,
  missingEmailCount,
  submitError,
}: SendRentCallsDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Envoyer les appels de loyer par email</AlertDialogTitle>
          <AlertDialogDescription>
            Vous allez envoyer{" "}
            <span className="font-medium">
              {unsentCount} appel{unsentCount > 1 ? "s" : ""} de loyer
            </span>{" "}
            par email pour{" "}
            <span className="font-medium">{formatMonth(month)}</span>.
            {missingEmailCount > 0 && (
              <>
                {" "}
                <span className="font-medium text-amber-600">
                  {missingEmailCount} locataire{missingEmailCount > 1 ? "s" : ""} sans
                  email
                </span>{" "}
                {missingEmailCount > 1 ? "seront" : "sera"} ignoré{missingEmailCount > 1 ? "s" : ""}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {submitError && (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
          >
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isPending ? "Envoi en cours…" : "Envoyer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
