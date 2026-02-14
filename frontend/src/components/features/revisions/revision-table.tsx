'use client';

import type { Revision } from '@/lib/api/revisions-api';

const formatEuros = (cents: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);

interface RevisionTableProps {
  revisions: Revision[];
}

export function RevisionTable({ revisions }: RevisionTableProps) {
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
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Locataire</th>
              <th className="px-4 py-3 text-left font-medium">Lot</th>
              <th className="px-4 py-3 text-right font-medium">Loyer actuel</th>
              <th className="px-4 py-3 text-right font-medium">Nouveau loyer</th>
              <th className="px-4 py-3 text-right font-medium">Différence</th>
              <th className="px-4 py-3 text-left font-medium">Indice</th>
              <th className="px-4 py-3 text-left font-medium">Formule</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((revision) => (
              <tr key={revision.id} className="border-b last:border-b-0">
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
                    {revision.status === 'approved' ? 'Approuvée' : 'En attente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
