"use client";

import { useState } from "react";
import { Receipt, Download, FileDown, Loader2, CheckCircle2, Banknote, FileText, Building2, CircleDot, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RentCallData } from "@/lib/api/rent-calls-api";
import { useRentCallPayments } from "@/hooks/use-rent-call-payments";
import type { PaymentData } from "@/lib/api/account-entries-api";

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function PaymentMethodIcon({ method }: { method: string | null }) {
  switch (method) {
    case "cash":
      return <Banknote className="mr-1 h-3 w-3" aria-hidden="true" />;
    case "check":
      return <FileText className="mr-1 h-3 w-3" aria-hidden="true" />;
    case "bank_transfer":
      return <Building2 className="mr-1 h-3 w-3" aria-hidden="true" />;
    default:
      return <CircleDot className="mr-1 h-3 w-3" aria-hidden="true" />;
  }
}

interface RentCallListProps {
  rentCalls: RentCallData[];
  tenantNames: Map<string, string>;
  unitIdentifiers: Map<string, string>;
  onDownloadPdf?: (rentCallId: string) => void;
  downloadingId?: string | null;
  downloadError?: string | null;
  onRecordPayment?: (rentCallId: string) => void;
  onDownloadReceipt?: (rentCallId: string) => void;
  receiptDownloadingId?: string | null;
  receiptDownloadError?: string | null;
}

export function RentCallList({
  rentCalls,
  tenantNames,
  unitIdentifiers,
  onDownloadPdf,
  downloadingId,
  downloadError,
  onRecordPayment,
  onDownloadReceipt,
  receiptDownloadingId,
  receiptDownloadError,
}: RentCallListProps) {
  if (rentCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Receipt
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aucun appel de loyer
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Générez les appels de loyer pour ce mois
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {downloadError && (
        <p className="text-sm text-destructive">{downloadError}</p>
      )}
      {receiptDownloadError && (
        <p className="text-sm text-destructive">{receiptDownloadError}</p>
      )}
      {rentCalls.map((rc: RentCallData) => (
        <Card key={rc.id}>
          <CardContent className="flex items-start justify-between p-4">
            <div className="space-y-1">
              <p className="font-medium">
                {tenantNames.get(rc.tenantId) ?? "Locataire inconnu"}
              </p>
              <p className="text-sm text-muted-foreground">
                {unitIdentifiers.get(rc.unitId) ?? "Lot inconnu"}
              </p>
              {rc.billingLines.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Loyer : {formatAmount(rc.rentAmountCents)}
                  </p>
                  {rc.billingLines.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {line.categoryLabel} : {formatAmount(line.amountCents)}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-lg font-semibold tabular-nums">
                {formatAmount(rc.totalAmountCents)}
              </p>
              {rc.isProRata && (
                <Badge variant="secondary">Pro-rata</Badge>
              )}
              {rc.paymentStatus === "paid" && rc.paidAt && (
                <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                  <PaymentMethodIcon method={rc.paymentMethod} />
                  Payé le{" "}
                  {new Date(rc.paymentDate ?? rc.paidAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              )}
              {rc.paymentStatus === "overpaid" && (
                <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                  <PaymentMethodIcon method={rc.paymentMethod} />
                  Payé (trop-perçu : {formatAmount(rc.overpaymentCents ?? 0)})
                </Badge>
              )}
              {rc.paymentStatus === "partial" && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                  <PaymentMethodIcon method={rc.paymentMethod} />
                  Partiellement payé — {formatAmount(rc.paidAmountCents ?? 0)} / {formatAmount(rc.totalAmountCents)}
                </Badge>
              )}
              {!rc.paymentStatus && !rc.paidAt && rc.sentAt && (
                <Badge variant="outline" className="text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-700">
                  <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                  Envoyé le{" "}
                  {new Date(rc.sentAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              )}
              {/* Backward compat: old paid data without paymentStatus */}
              {!rc.paymentStatus && rc.paidAt && (
                <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-400 dark:border-green-700">
                  <PaymentMethodIcon method={rc.paymentMethod} />
                  Payé le{" "}
                  {new Date(rc.paymentDate ?? rc.paidAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </Badge>
              )}
              {(rc.paymentStatus === "partial" || rc.paymentStatus === "paid" || rc.paymentStatus === "overpaid" || rc.paidAt) && (
                <PaymentHistoryToggle entityId={rc.entityId} rentCallId={rc.id} />
              )}
              <div className="flex gap-1 mt-1">
                {onDownloadPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadPdf(rc.id)}
                    disabled={downloadingId != null}
                  >
                    {downloadingId === rc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="ml-1">PDF</span>
                  </Button>
                )}
                {onDownloadReceipt && (rc.paymentStatus === "paid" || rc.paymentStatus === "overpaid" || rc.paymentStatus === "partial") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadReceipt(rc.id)}
                    disabled={receiptDownloadingId != null}
                    title={rc.paymentStatus === "partial" ? "Télécharger le reçu" : "Télécharger la quittance"}
                  >
                    {receiptDownloadingId === rc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="ml-1">
                      {rc.paymentStatus === "partial" ? "Reçu" : "Quittance"}
                    </span>
                  </Button>
                )}
                {onRecordPayment && rc.paymentStatus !== "paid" && rc.paymentStatus !== "overpaid" && !(!rc.paymentStatus && rc.paidAt) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRecordPayment(rc.id)}
                  >
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                    <span className="ml-1">Enregistrer un paiement</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PaymentHistoryToggle({ entityId, rentCallId }: { entityId: string; rentCallId: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: payments, isLoading } = useRentCallPayments(entityId, expanded ? rentCallId : null);

  return (
    <div className="mt-1">
      <button
        type="button"
        className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Voir les paiements
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {isLoading && <p className="text-xs text-muted-foreground">Chargement...</p>}
          {payments && payments.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucun paiement enregistré</p>
          )}
          {payments && payments.map((p: PaymentData) => (
            <div key={p.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              <PaymentMethodIcon method={p.paymentMethod} />
              <span>{new Date(p.paymentDate).toLocaleDateString("fr-FR")}</span>
              <span className="font-medium">{formatAmount(p.amountCents)}</span>
              <span>{p.payerName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
