'use client';

import { useCurrentEntity } from '@/hooks/use-current-entity';
import { useRevisions } from '@/hooks/use-revisions';
import { RevisionTable } from '@/components/features/revisions/revision-table';
import { CalculateRevisionsDialog } from '@/components/features/revisions/calculate-revisions-dialog';
import { Loader2 } from 'lucide-react';

export default function RevisionsPage() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Révisions de loyer</h1>
        <div className="mt-6 rounded-lg border p-8 text-center text-muted-foreground">
          <p>Sélectionnez une entité pour voir les révisions.</p>
        </div>
      </div>
    );
  }

  return <RevisionsContent entityId={entityId} />;
}

function RevisionsContent({ entityId }: { entityId: string }) {
  const { data: revisions, isLoading, error } = useRevisions(entityId);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Révisions de loyer</h1>
        <CalculateRevisionsDialog entityId={entityId} />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            Une erreur est survenue lors du chargement des révisions.
          </div>
        ) : (
          <RevisionTable revisions={revisions ?? []} entityId={entityId} />
        )}
      </div>
    </div>
  );
}
