"use client";

import { CreditCard } from "lucide-react";

import { useCurrentEntity } from "@/hooks/use-current-entity";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PaymentsPageContent } from "@/components/features/payments/payments-page-content";

export default function PaymentsPage() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour voir vos paiements
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <PaymentsPageContent entityId={entityId} />;
}
