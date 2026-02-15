"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, Loader2, Mail, CircleDollarSign } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  useChargeRegularization,
  useCalculateChargeRegularization,
  useApplyChargeRegularization,
  useSendChargeRegularization,
  useSettleChargeRegularization,
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
  const applyMutation = useApplyChargeRegularization(entityId, fiscalYear);
  const sendMutation = useSendChargeRegularization(entityId, fiscalYear);
  const settleMutation = useSettleChargeRegularization(entityId, fiscalYear);
  const { downloadPdf, isDownloading, downloadingLeaseId, error } =
    useDownloadRegularizationPdf(entityId, fiscalYear);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    failures: string[];
  } | null>(null);

  const isApplied = !!regularization?.appliedAt;
  const isSent = !!regularization?.sentAt;
  const isSettled = !!regularization?.settledAt;

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

            <div className="flex items-center justify-end gap-2">
              {isApplied ? (
                <Badge
                  variant="secondary"
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Déjà appliquée
                </Badge>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={applyMutation.isPending}
                      size="sm"
                      variant="default"
                    >
                      {applyMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Appliquer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Appliquer la régularisation
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Voulez-vous appliquer la régularisation des charges pour
                        l&apos;exercice {fiscalYear} aux comptes des locataires ?
                        Cette opération créera les débits et crédits correspondants.
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => applyMutation.mutate()}
                      >
                        Appliquer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isSent ? (
                <Badge
                  variant="secondary"
                  className="gap-1"
                >
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  Déjà envoyée
                </Badge>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={sendMutation.isPending}
                      size="sm"
                      variant="outline"
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Envoyer par email
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Envoyer les décomptes par email
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Voulez-vous envoyer les décomptes de régularisation des
                        charges pour l&apos;exercice {fiscalYear} à chaque locataire
                        par email avec le PDF en pièce jointe ?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          sendMutation.mutate(undefined, {
                            onSuccess: (data) => setSendResult(data),
                          });
                        }}
                      >
                        Envoyer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {isApplied && isSent && (
                isSettled ? (
                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    <CircleDollarSign className="h-3 w-3" aria-hidden="true" />
                    Réglée
                  </Badge>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={settleMutation.isPending}
                        size="sm"
                        variant="outline"
                      >
                        {settleMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CircleDollarSign className="mr-2 h-4 w-4" />
                        )}
                        Marquer comme réglée
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Marquer comme réglée
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Confirmez-vous que la régularisation des charges pour
                          l&apos;exercice {fiscalYear} a été réglée par tous les
                          locataires ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => settleMutation.mutate()}
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )
              )}
            </div>

            {applyMutation.isError && (
              <p className="text-sm text-destructive">
                Erreur lors de l&apos;application de la régularisation. Veuillez
                réessayer.
              </p>
            )}

            {sendMutation.isError && (
              <p className="text-sm text-destructive">
                Erreur lors de l&apos;envoi des décomptes. Veuillez réessayer.
              </p>
            )}

            {settleMutation.isError && (
              <p className="text-sm text-destructive">
                Erreur lors du règlement. Veuillez réessayer.
              </p>
            )}

            {sendResult && (
              <div className="text-sm space-y-1">
                <p className="text-green-600 dark:text-green-400">
                  {sendResult.sent} décompte{sendResult.sent > 1 ? "s" : ""}{" "}
                  envoyé{sendResult.sent > 1 ? "s" : ""} avec succès.
                </p>
                {sendResult.failed > 0 && (
                  <div className="text-destructive">
                    <p>
                      {sendResult.failed} échec{sendResult.failed > 1 ? "s" : ""} :
                    </p>
                    <ul className="list-disc list-inside">
                      {sendResult.failures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

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
