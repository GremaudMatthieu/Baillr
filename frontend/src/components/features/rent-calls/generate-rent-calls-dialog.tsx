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

interface GenerateRentCallsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  month: string;
  activeLeaseCount: number;
  submitError?: string | null;
}

export function GenerateRentCallsDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  month,
  activeLeaseCount,
  submitError,
}: GenerateRentCallsDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Générer les appels de loyer</AlertDialogTitle>
          <AlertDialogDescription>
            Vous allez générer les appels de loyer pour{" "}
            <span className="font-medium">{formatMonth(month)}</span> pour{" "}
            <span className="font-medium">
              {activeLeaseCount} bail{activeLeaseCount > 1 ? "x" : ""} actif
              {activeLeaseCount > 1 ? "s" : ""}
            </span>
            .
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
            {isPending ? "Génération…" : "Générer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
