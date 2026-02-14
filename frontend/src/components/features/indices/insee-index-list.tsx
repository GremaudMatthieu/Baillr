"use client";

import { useMemo } from "react";
import type { InseeIndexData } from "@/lib/api/insee-indices-api";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { REFERENCE_QUARTER_LABELS } from "@/lib/constants/reference-quarters";

interface InseeIndexListProps {
  indices: InseeIndexData[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function InseeIndexList({ indices }: InseeIndexListProps) {
  const groupedIndices = useMemo(() => {
    const groups: Record<string, InseeIndexData[]> = {};
    for (const index of indices) {
      if (!groups[index.type]) {
        groups[index.type] = [];
      }
      groups[index.type].push(index);
    }
    // Sort within each group by year desc, then quarter desc
    for (const type of Object.keys(groups)) {
      groups[type].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.quarter.localeCompare(a.quarter);
      });
    }
    return groups;
  }, [indices]);

  if (indices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucun indice enregistré. Utilisez le formulaire ci-dessus pour ajouter
        votre premier indice.
      </p>
    );
  }

  const typeOrder = ["IRL", "ILC", "ICC"];

  return (
    <div className="space-y-6">
      {typeOrder
        .filter((type) => groupedIndices[type]?.length)
        .map((type) => (
          <div key={type}>
            <h3 className="text-sm font-semibold mb-2">
              {REVISION_INDEX_TYPE_LABELS[type] || type}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium">Trimestre</th>
                    <th className="pb-2 pr-4 font-medium">Année</th>
                    <th className="pb-2 pr-4 font-medium">Valeur</th>
                    <th className="pb-2 font-medium">
                      Date d&apos;enregistrement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groupedIndices[type].map((index) => (
                    <tr key={index.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {REFERENCE_QUARTER_LABELS[index.quarter] ||
                          index.quarter}
                      </td>
                      <td className="py-2 pr-4">{index.year}</td>
                      <td className="py-2 pr-4 font-mono">{index.value}</td>
                      <td className="py-2 text-muted-foreground">
                        {formatDate(index.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
