"use client";

import { useState, useMemo } from "react";
import { Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import {
  useAnnualCharges,
  useRecordAnnualCharges,
  useProvisionsCollected,
} from "@/hooks/use-annual-charges";
import { AnnualChargesForm } from "@/components/features/charges/annual-charges-form";
import { ChargesSummary } from "@/components/features/charges/charges-summary";
import type { ChargeEntryData } from "@/lib/api/annual-charges-api";

function getYearOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  const options: { value: string; label: string }[] = [];
  for (let year = currentYear; year >= currentYear - 5; year--) {
    options.push({ value: String(year), label: String(year) });
  }
  return options;
}

export default function ChargesPage() {
  const { entityId } = useCurrentEntity();

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Charges annuelles
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Coins
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour gérer vos charges
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ChargesPageContent entityId={entityId} />;
}

function ChargesPageContent({ entityId }: { entityId: string }) {
  const defaultYear = String(new Date().getFullYear() - 1);
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const fiscalYear = parseInt(selectedYear, 10);

  const yearOptions = useMemo(() => getYearOptions(), []);

  const {
    data: annualCharges,
    isLoading,
    isError,
  } = useAnnualCharges(entityId, fiscalYear);

  const { data: provisions } = useProvisionsCollected(entityId, fiscalYear);

  const recordMutation = useRecordAnnualCharges(entityId);

  function handleSubmit(charges: ChargeEntryData[]) {
    const id = `${entityId}-${fiscalYear}`;
    recordMutation.mutate({
      id,
      fiscalYear,
      charges,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Charges annuelles
        </h1>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]" aria-label="Exercice fiscal">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Charges réelles — Exercice {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Chargement…
              </p>
            ) : isError ? (
              <p className="text-sm text-destructive py-8 text-center">
                Erreur lors du chargement des charges.
              </p>
            ) : (
              <AnnualChargesForm
                key={`${entityId}-${selectedYear}`}
                onSubmit={handleSubmit}
                isSubmitting={recordMutation.isPending}
                initialCharges={annualCharges?.charges}
              />
            )}
            {recordMutation.isError && (
              <p className="mt-2 text-sm text-destructive">
                Erreur lors de l&apos;enregistrement. Veuillez réessayer.
              </p>
            )}
            {recordMutation.isSuccess && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                Charges enregistrées avec succès.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Comparaison charges / provisions — {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChargesSummary
              charges={annualCharges?.charges ?? []}
              provisions={provisions ?? null}
              totalChargesCents={annualCharges?.totalAmountCents ?? 0}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
