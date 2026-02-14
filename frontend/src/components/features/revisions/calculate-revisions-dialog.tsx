'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calculator, Loader2 } from 'lucide-react';
import { useCalculateRevisions } from '@/hooks/use-revisions';
import type { BatchCalculationResult } from '@/lib/api/revisions-api';

interface CalculateRevisionsDialogProps {
  entityId: string;
}

export function CalculateRevisionsDialog({
  entityId,
}: CalculateRevisionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<BatchCalculationResult | null>(null);
  const mutation = useCalculateRevisions(entityId);

  const handleCalculate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (mutation.isPending) return; // double-click guard
    try {
      const result = await mutation.mutateAsync();
      setSummary(result);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSummary(null);
      mutation.reset();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button>
          <Calculator className="mr-2 h-4 w-4" />
          Calculer les révisions
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {summary ? 'Résultat du calcul' : 'Calculer les révisions de loyer'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {summary ? (
              <span className="space-y-2 text-left">
                <span className="block">
                  {summary.calculated > 0 && (
                    <span className="block text-green-600 dark:text-green-400">
                      {summary.calculated} révision
                      {summary.calculated > 1 ? 's' : ''} calculée
                      {summary.calculated > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.skipped.length > 0 && (
                    <span className="block text-muted-foreground">
                      {summary.skipped.length} bail
                      {summary.skipped.length > 1 ? 'x' : ''} ignoré
                      {summary.skipped.length > 1 ? 's' : ''} (déjà révisé
                      {summary.skipped.length > 1 ? 's' : ''} ou indice manquant)
                    </span>
                  )}
                  {summary.errors.length > 0 && (
                    <span className="block text-red-600 dark:text-red-400">
                      {summary.errors.length} erreur
                      {summary.errors.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.calculated === 0 &&
                    summary.skipped.length === 0 &&
                    summary.errors.length === 0 && (
                      <span className="block text-muted-foreground">
                        Aucun bail éligible à la révision.
                      </span>
                    )}
                </span>
              </span>
            ) : mutation.isError ? (
              <span className="text-red-600 dark:text-red-400">
                Une erreur est survenue lors du calcul des révisions.
              </span>
            ) : (
              'Le système va calculer les révisions pour tous les baux éligibles en utilisant la formule officielle et les indices enregistrés.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {summary ? (
            <AlertDialogAction>Fermer</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={mutation.isPending}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCalculate}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calcul en cours...
                  </>
                ) : (
                  'Calculer'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
