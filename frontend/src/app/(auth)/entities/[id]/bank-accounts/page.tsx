"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEntity } from "@/hooks/use-entities";
import { BankAccountList } from "@/components/features/entities/bank-account-list";

export default function BankAccountsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: entity, isLoading, error } = useEntity(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Entité introuvable</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Comptes bancaires
          </h1>
          <p className="text-sm text-muted-foreground">{entity.name}</p>
        </div>
      </div>
      <BankAccountList entityId={id} />
    </div>
  );
}
