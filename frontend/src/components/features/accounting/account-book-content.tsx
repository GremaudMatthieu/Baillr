"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useAccountBook } from "@/hooks/use-accounting";
import { useTenants } from "@/hooks/use-tenants";
import { AccountBookSummary } from "./account-book-summary";
import { AccountBookFilters } from "./account-book-filters";
import { AccountBookTable } from "./account-book-table";
import type { AccountingFilters } from "@/lib/api/accounting-api";

export function AccountBookContent() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Livre de comptes
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour consulter votre livre de
            comptes
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <AccountBookInner entityId={entityId} />;
}

function AccountBookInner({ entityId }: { entityId: string }) {
  const [filters, setFilters] = useState<AccountingFilters>({});
  const { data, isLoading, isError } = useAccountBook(entityId, filters);
  const { data: tenants } = useTenants(entityId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Livre de comptes</h1>
      </div>

      <div className="space-y-4">
        {data && (
          <AccountBookSummary
            totalBalanceCents={data.totalBalanceCents}
            entryCount={data.entries.length}
          />
        )}

        <AccountBookFilters
          filters={filters}
          onFiltersChange={setFilters}
          tenants={tenants ?? []}
          availableCategories={data?.availableCategories ?? []}
        />

        {isLoading && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Chargement…
          </p>
        )}

        {isError && (
          <p className="text-sm text-destructive py-8 text-center">
            Erreur lors du chargement du livre de comptes.
          </p>
        )}

        {data && data.entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Aucune écriture comptable
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les écritures apparaîtront automatiquement lorsque vous générerez
              des appels de loyer et enregistrerez des paiements.
            </p>
          </div>
        )}

        {data && data.entries.length > 0 && (
          <AccountBookTable entries={data.entries} />
        )}
      </div>
    </div>
  );
}
