"use client";

import { Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useChargeRegularization,
  useCalculateChargeRegularization,
} from "@/hooks/use-charge-regularization";
import { useDownloadRegularizationPdf } from "@/hooks/use-download-regularization-pdf";
import { RegularizationStatementCard } from "./regularization-statement-card";
import { formatCurrency } from "@/lib/utils/format-currency";

interface ChargeRegularizationSectionProps {
  entityId: string;
  fiscalYear: number;
}

export function ChargeRegularizationSection({
  entityId,
  fiscalYear,
}: ChargeRegularizationSectionProps) {
  const { data: regularization, isLoading } = useChargeRegularization(
    entityId,
    fiscalYear,
  );
  const calculateMutation = useCalculateChargeRegularization(entityId);
  const { downloadPdf, isDownloading, downloadingLeaseId, error } =
    useDownloadRegularizationPdf(entityId, fiscalYear);

  function handleGenerate() {
    const id = `${entityId}-${fiscalYear}`;
    calculateMutation.mutate({ id, fiscalYear });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Régularisation des charges — {fiscalYear}
          </CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={calculateMutation.isPending}
                size="sm"
              >
                {calculateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Générer la régularisation
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Générer la régularisation</AlertDialogTitle>
                <AlertDialogDescription>
                  Voulez-vous générer la régularisation des charges pour
                  l&apos;exercice {fiscalYear} ? Cela remplacera les résultats
                  existants.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleGenerate}>
                  Générer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Chargement…
          </p>
        )}

        {calculateMutation.isError && (
          <p className="text-sm text-destructive mb-4">
            Erreur lors du calcul de la régularisation. Veuillez réessayer.
          </p>
        )}

        {calculateMutation.isSuccess && !regularization && (
          <p className="text-sm text-green-600 dark:text-green-400 mb-4">
            Régularisation calculée. Rechargement en cours…
          </p>
        )}

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {!isLoading && !regularization && !calculateMutation.isSuccess && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calculator
              className="h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Aucune régularisation calculée pour cet exercice.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cliquez sur &quot;Générer la régularisation&quot; pour calculer
              les décomptes par locataire.
            </p>
          </div>
        )}

        {regularization && regularization.statements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-medium border-b pb-2">
              <span>
                {regularization.statements.length} locataire
                {regularization.statements.length > 1 ? "s" : ""}
              </span>
              <span>
                Solde total : {formatCurrency(regularization.totalBalanceCents)}
              </span>
            </div>
            {regularization.statements.map((statement) => (
              <RegularizationStatementCard
                key={statement.leaseId}
                statement={statement}
                onDownloadPdf={downloadPdf}
                isDownloading={isDownloading}
                downloadingLeaseId={downloadingLeaseId}
              />
            ))}
          </div>
        )}

        {regularization && regularization.statements.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Aucun locataire à régulariser pour cet exercice.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
