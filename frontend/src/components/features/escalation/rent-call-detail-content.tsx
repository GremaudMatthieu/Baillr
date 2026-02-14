"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useUnpaidRentCalls } from "@/hooks/use-unpaid-rent-calls";
import {
  useEscalationStatus,
  useSendReminderEmail,
  useDownloadFormalNotice,
  useDownloadStakeholderLetter,
} from "@/hooks/use-escalation";
import { StatusTimeline } from "./status-timeline";

interface RentCallDetailContentProps {
  rentCallId: string;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function RentCallDetailContent({
  rentCallId,
}: RentCallDetailContentProps) {
  const { entityId } = useCurrentEntity();
  const { data: unpaidRentCalls, isLoading } = useUnpaidRentCalls(entityId ?? undefined);

  const rentCall = unpaidRentCalls?.find((rc) => rc.id === rentCallId) ?? null;

  const {
    data: escalation,
    isLoading: isLoadingEscalation,
  } = useEscalationStatus(entityId ?? "", rentCallId);

  const reminderMutation = useSendReminderEmail(entityId ?? "");

  const {
    download: downloadFormalNotice,
    isDownloading: isDownloadingFormalNotice,
    error: formalNoticeError,
  } = useDownloadFormalNotice(entityId ?? "");

  const {
    download: downloadStakeholderLetter,
    isDownloading: isDownloadingStakeholder,
    downloadingType: downloadingStakeholderType,
    error: stakeholderError,
  } = useDownloadStakeholderLetter(entityId ?? "");

  if (!entityId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aucune entité sélectionnée
        </p>
        <Button asChild className="mt-4">
          <Link href="/entities">Gérer mes entités</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!rentCall) {
    return (
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/rent-calls?filter=unpaid">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Retour aux impayés
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Appel de loyer introuvable
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cet appel de loyer n&apos;existe pas ou n&apos;est plus impayé.
          </p>
        </div>
      </div>
    );
  }

  const tenantName =
    rentCall.tenantType === "company" && rentCall.tenantCompanyName
      ? rentCall.tenantCompanyName
      : `${rentCall.tenantFirstName} ${rentCall.tenantLastName}`;

  const remainingAmount = formatAmount(
    rentCall.remainingBalanceCents ?? rentCall.totalAmountCents,
  );
  const totalAmount = formatAmount(rentCall.totalAmountCents);

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/rent-calls?filter=unpaid">
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Retour aux impayés
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Impayé — {tenantName}
        </h1>
        <Badge variant="destructive">
          {rentCall.daysLate} jour{rentCall.daysLate > 1 ? "s" : ""} de retard
        </Badge>
      </div>

      {/* Rent call summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Détails de l&apos;appel de loyer</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Locataire</dt>
              <dd className="font-medium">{tenantName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Lot</dt>
              <dd className="font-medium">{rentCall.unitIdentifier}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Période</dt>
              <dd className="font-medium">{rentCall.month}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Montant total</dt>
              <dd className="font-medium">{totalAmount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Restant dû</dt>
              <dd className="font-medium text-destructive">{remainingAmount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Jours de retard</dt>
              <dd className="font-medium text-destructive">
                {rentCall.daysLate} jour{rentCall.daysLate > 1 ? "s" : ""}
              </dd>
            </div>
            {rentCall.paymentStatus === "partial" && (
              <div>
                <dt className="text-muted-foreground">Statut</dt>
                <dd>
                  <Badge variant="secondary" className="text-xs">
                    Paiement partiel
                  </Badge>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Error messages */}
      {reminderMutation.error && (
        <p className="mb-4 text-sm text-destructive">
          {reminderMutation.error instanceof Error
            ? reminderMutation.error.message
            : "Erreur lors de l'envoi de la relance"}
        </p>
      )}
      {formalNoticeError && (
        <p className="mb-4 text-sm text-destructive">{formalNoticeError}</p>
      )}
      {stakeholderError && (
        <p className="mb-4 text-sm text-destructive">{stakeholderError}</p>
      )}

      {/* Success message for reminder */}
      {reminderMutation.isSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Relance envoyée avec succès
        </div>
      )}

      {/* StatusTimeline */}
      {isLoadingEscalation ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <StatusTimeline
          escalation={escalation ?? null}
          onSendReminder={() => reminderMutation.mutate(rentCallId)}
          isSendingReminder={reminderMutation.isPending}
          onDownloadFormalNotice={() => downloadFormalNotice(rentCallId)}
          isDownloadingFormalNotice={isDownloadingFormalNotice}
          onDownloadStakeholderLetter={(type) =>
            downloadStakeholderLetter(rentCallId, type)
          }
          isDownloadingStakeholder={isDownloadingStakeholder}
          downloadingStakeholderType={downloadingStakeholderType}
        />
      )}
    </div>
  );
}
