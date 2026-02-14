'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { ApproveRevisionsDialog } from './approve-revisions-dialog';
import { formatEuros } from '@/lib/format';
import type { Revision } from '@/lib/api/revisions-api';

interface RevisionTableProps {
  revisions: Revision[];
  entityId: string;
}

export function RevisionTable({ revisions, entityId }: RevisionTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approveMode, setApproveMode] = useState<'selected' | 'all'>(
    'selected',
  );

  const pendingRevisions = useMemo(
    () => revisions.filter((r) => r.status === 'pending'),
    [revisions],
  );

  const selectedRevisions = useMemo(
    () => revisions.filter((r) => selectedIds.has(r.id)),
    [revisions, selectedIds],
  );

  const revisionsToApprove =
    approveMode === 'all' ? pendingRevisions : selectedRevisions;

  const allPendingSelected =
    pendingRevisions.length > 0 &&
    pendingRevisions.every((r) => selectedIds.has(r.id));

  const handleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRevisions.map((r) => r.id)));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApproved = () => {
    setSelectedIds(new Set());
  };

  if (revisions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        <p>Aucune révision en attente.</p>
        <p className="mt-1 text-sm">
          Calculez les révisions pour voir les résultats ici.
        </p>
      </div>
    );
  }

  return (
    <div>
      {pendingRevisions.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => {
              setApproveMode('selected');
              setDialogOpen(true);
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approuver la sélection ({selectedIds.size})
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setApproveMode('all');
              setDialogOpen(true);
            }}
          >
            Tout approuver ({pendingRevisions.length})
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {pendingRevisions.length > 0 && (
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allPendingSelected}
                      onChange={handleSelectAll}
                      aria-label="Sélectionner toutes les révisions en attente"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium">Locataire</th>
                <th className="px-4 py-3 text-left font-medium">Lot</th>
                <th className="px-4 py-3 text-right font-medium">
                  Loyer actuel
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Nouveau loyer
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Différence
                </th>
                <th className="px-4 py-3 text-left font-medium">Indice</th>
                <th className="px-4 py-3 text-left font-medium">Formule</th>
                <th className="px-4 py-3 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {revisions.map((revision) => (
                <tr key={revision.id} className="border-b last:border-b-0">
                  {pendingRevisions.length > 0 && (
                    <td className="px-4 py-3 text-center">
                      {revision.status === 'pending' ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(revision.id)}
                          onChange={() => handleSelect(revision.id)}
                          aria-label={`Sélectionner la révision de ${revision.tenantName}`}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      ) : null}
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">
                    {revision.tenantName}
                  </td>
                  <td className="px-4 py-3">{revision.unitLabel}</td>
                  <td className="px-4 py-3 text-right">
                    {formatEuros(revision.currentRentCents)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatEuros(revision.newRentCents)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right ${
                      revision.differenceCents >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {revision.differenceCents >= 0 ? '+' : ''}
                    {formatEuros(revision.differenceCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {revision.revisionIndexType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {revision.baseIndexValue} → {revision.newIndexValue} (
                    {revision.baseIndexQuarter} {revision.newIndexYear})
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        revision.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {revision.status === 'approved'
                        ? 'Approuvée'
                        : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ApproveRevisionsDialog
        entityId={entityId}
        revisions={revisionsToApprove}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onApproved={handleApproved}
      />
    </div>
  );
}
