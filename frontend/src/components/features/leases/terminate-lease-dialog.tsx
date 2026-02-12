"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  terminateLeaseSchema,
  type TerminateLeaseFormData,
} from "./terminate-lease-schema";

interface TerminateLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (endDate: string) => void;
  isPending: boolean;
  submitError?: string | null;
}

export function TerminateLeaseDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  submitError,
}: TerminateLeaseDialogProps) {
  const form = useForm<TerminateLeaseFormData>({
    resolver: zodResolver(terminateLeaseSchema),
    defaultValues: { endDate: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    void form.handleSubmit((data) => {
      const isoDate = new Date(data.endDate).toISOString();
      onConfirm(isoDate);
    })();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Résilier ce bail</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action mettra fin au bail. Le logement sera marqué comme
            vacant à partir de la date de fin sélectionnée.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Label htmlFor="endDate">Date de fin</Label>
          <Input
            id="endDate"
            type="date"
            {...form.register("endDate")}
            aria-invalid={!!form.formState.errors.endDate}
          />
          {form.formState.errors.endDate && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.endDate.message}
            </p>
          )}
          {submitError && (
            <p className="mt-1 text-sm text-destructive">{submitError}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Résiliation…" : "Résilier"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
