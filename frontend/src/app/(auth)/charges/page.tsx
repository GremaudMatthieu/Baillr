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
import { useChargeCategories, useCreateChargeCategory } from "@/hooks/use-charge-categories";
import { useEntityUnits } from "@/hooks/use-units";
import {
  useWaterMeterReadings,
  useRecordWaterMeterReadings,
  useWaterDistribution,
} from "@/hooks/use-water-meter-readings";
import { AnnualChargesForm } from "@/components/features/charges/annual-charges-form";
import { ChargesSummary } from "@/components/features/charges/charges-summary";
import { WaterMeterReadingsForm } from "@/components/features/charges/water-meter-readings-form";
import { WaterDistributionSummary } from "@/components/features/charges/water-distribution-summary";
import type { ChargeEntryData } from "@/lib/api/annual-charges-api";
import type { MeterReadingData } from "@/lib/api/water-meter-api";

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
  const { data: chargeCategories } = useChargeCategories(entityId);
  const createCategoryMutation = useCreateChargeCategory(entityId);

  const recordMutation = useRecordAnnualCharges(entityId);

  const { data: entityUnits } = useEntityUnits(entityId);
  const { data: waterReadings, isLoading: isLoadingReadings } =
    useWaterMeterReadings(entityId, fiscalYear);
  const recordReadingsMutation = useRecordWaterMeterReadings(entityId);
  const { data: waterDistribution } = useWaterDistribution(
    entityId,
    fiscalYear,
  );

  function handleSubmit(charges: ChargeEntryData[]) {
    const id = `${entityId}-${fiscalYear}`;
    recordMutation.mutate({
      id,
      fiscalYear,
      charges,
    });
  }

  function handleReadingsSubmit(readings: MeterReadingData[]) {
    const id = `${entityId}-${fiscalYear}`;
    recordReadingsMutation.mutate({
      id,
      fiscalYear,
      readings,
    });
  }

  const units = entityUnits ?? [];

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
                chargeCategories={chargeCategories ?? []}
                onCreateCategory={(label) => createCategoryMutation.mutateAsync(label)}
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

        {units.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Relevés de compteurs d&apos;eau — Exercice {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReadings ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Chargement…
                </p>
              ) : (
                <WaterMeterReadingsForm
                  key={`readings-${entityId}-${selectedYear}`}
                  onSubmit={handleReadingsSubmit}
                  isSubmitting={recordReadingsMutation.isPending}
                  units={units}
                  initialReadings={waterReadings?.readings}
                />
              )}
              {recordReadingsMutation.isError && (
                <p className="mt-2 text-sm text-destructive">
                  Erreur lors de l&apos;enregistrement des relevés. Veuillez
                  réessayer.
                </p>
              )}
              {recordReadingsMutation.isSuccess && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="status">
                  Relevés enregistrés avec succès.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {waterDistribution && units.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Répartition des charges d&apos;eau — {selectedYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WaterDistributionSummary
                distribution={waterDistribution}
                units={units}
              />
            </CardContent>
          </Card>
        )}

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
              waterDistribution={waterDistribution ?? null}
              units={units}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
