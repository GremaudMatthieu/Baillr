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
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useApproveRevisions } from '@/hooks/use-revisions';
import { formatEuros } from '@/lib/format';
import type { Revision } from '@/lib/api/revisions-api';

interface ApproveRevisionsDialogProps {
  entityId: string;
  revisions: Revision[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
}

export function ApproveRevisionsDialog({
  entityId,
  revisions,
  open,
  onOpenChange,
  onApproved,
}: ApproveRevisionsDialogProps) {
  const [done, setDone] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const mutation = useApproveRevisions(entityId);

  const totalDifferenceCents = revisions.reduce(
    (sum, r) => sum + r.differenceCents,
    0,
  );

  const handleApprove = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const count = revisions.length;
    const ids = revisions.map((r) => r.id);
    try {
      await mutation.mutateAsync(ids);
      setApprovedCount(count);
      setDone(true);
      onApproved();
    } catch {
      // Error handled by mutation state
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setDone(false);
      setApprovedCount(0);
      mutation.reset();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {done ? 'Révisions approuvées' : 'Approuver les révisions'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {done ? (
              <span className="text-green-600 dark:text-green-400">
                {approvedCount} révision
                {approvedCount > 1 ? 's' : ''} approuvée
                {approvedCount > 1 ? 's' : ''} avec succès.
              </span>
            ) : mutation.isError ? (
              <span className="text-red-600 dark:text-red-400">
                Une erreur est survenue lors de l&apos;approbation.
              </span>
            ) : (
              <span>
                Vous allez approuver{' '}
                <span className="font-medium">
                  {revisions.length} révision
                  {revisions.length > 1 ? 's' : ''}
                </span>
                . Impact total sur les loyers :{' '}
                <span
                  className={`font-medium ${
                    totalDifferenceCents >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {totalDifferenceCents >= 0 ? '+' : ''}
                  {formatEuros(totalDifferenceCents)}
                </span>
                /mois. Cette action est irréversible.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {done ? (
            <AlertDialogAction>Fermer</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={mutation.isPending}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleApprove}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approbation en cours...
                  </>
                ) : (
                  'Approuver'
                )}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
