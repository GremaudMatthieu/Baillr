"use client";

import { Receipt } from "lucide-react";

import { useCurrentEntity } from "@/hooks/use-current-entity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RentCallsPageContent } from "@/components/features/rent-calls/rent-calls-page-content";

export default function RentCallsPage() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Appels de loyer
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour voir vos appels de loyer
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <RentCallsPageContent entityId={entityId} />;
}
