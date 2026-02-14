"use client";

import * as React from "react";
import { Receipt, Mail, AlertTriangle } from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRentCalls,
  useGenerateRentCalls,
  useDownloadRentCallPdf,
  useSendRentCallsByEmail,
} from "@/hooks/use-rent-calls";
import { useLeases } from "@/hooks/use-leases";
import { useTenants } from "@/hooks/use-tenants";
import { useEntityUnits } from "@/hooks/use-units";
import { RentCallList } from "./rent-call-list";
import { BatchSummary } from "./batch-summary";
import { SendBatchSummary } from "./send-batch-summary";
import { GenerateRentCallsDialog } from "./generate-rent-calls-dialog";
import { SendRentCallsDialog } from "./send-rent-calls-dialog";
import { RecordManualPaymentDialog } from "./record-manual-payment-dialog";
import { useRecordManualPayment } from "@/hooks/use-record-manual-payment";
import { useDownloadReceipt } from "@/hooks/use-download-receipt";
import { useUnpaidRentCalls } from "@/hooks/use-unpaid-rent-calls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { GenerationResult, SendResult } from "@/lib/api/rent-calls-api";
import { getCurrentMonth, getMonthOptions } from "@/lib/month-options";

interface RentCallsPageContentProps {
  entityId: string;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function RentCallsPageContent({ entityId }: RentCallsPageContentProps) {
  const [filter, setFilter] = React.useState<"all" | "unpaid">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("filter") === "unpaid" ? "unpaid" : "all";
    }
    return "all";
  });
  const [selectedMonth, setSelectedMonth] = React.useState(getCurrentMonth);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [batchResult, setBatchResult] =
    React.useState<GenerationResult | null>(null);
  const [sendResult, setSendResult] = React.useState<SendResult | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [paymentRentCallId, setPaymentRentCallId] = React.useState<string | null>(null);

  const {
    data: rentCalls,
    isLoading: isLoadingRentCalls,
    isError: isErrorRentCalls,
  } = useRentCalls(entityId, selectedMonth);
  const { data: leases } = useLeases(entityId);
  const { data: tenants } = useTenants(entityId);
  const { data: units } = useEntityUnits(entityId);
  const generateMutation = useGenerateRentCalls(entityId);
  const sendMutation = useSendRentCallsByEmail(entityId);
  const {
    downloadPdf,
    downloadingId,
    error: downloadError,
  } = useDownloadRentCallPdf(entityId);
  const {
    recordPayment,
    isPending: isRecordingPayment,
    error: recordPaymentError,
  } = useRecordManualPayment(entityId);
  const {
    downloadReceipt,
    downloadingId: receiptDownloadingId,
    error: receiptDownloadError,
  } = useDownloadReceipt(entityId);
  const {
    data: unpaidRentCalls,
    isLoading: isLoadingUnpaid,
    isError: isErrorUnpaid,
  } = useUnpaidRentCalls(entityId);

  const activeLeases = React.useMemo(() => {
    if (!leases) return [];
    const now = new Date();
    return leases.filter((l) => !l.endDate || new Date(l.endDate) > now);
  }, [leases]);

  const alreadyGenerated = !!rentCalls && rentCalls.length > 0;

  const unsentRentCalls = React.useMemo(() => {
    if (!rentCalls) return [];
    return rentCalls.filter((rc) => !rc.sentAt);
  }, [rentCalls]);

  const hasUnsent = unsentRentCalls.length > 0;

  const missingEmailCount = React.useMemo(() => {
    if (!tenants || !unsentRentCalls.length) return 0;
    const tenantEmailMap = new Map<string, string>();
    for (const t of tenants) {
      tenantEmailMap.set(t.id, t.email ?? "");
    }
    return unsentRentCalls.filter(
      (rc) => !tenantEmailMap.get(rc.tenantId),
    ).length;
  }, [tenants, unsentRentCalls]);

  const tenantNames = React.useMemo(() => {
    const map = new Map<string, string>();
    if (tenants) {
      for (const t of tenants) {
        map.set(t.id, `${t.firstName} ${t.lastName}`);
      }
    }
    return map;
  }, [tenants]);

  const unitIdentifiers = React.useMemo(() => {
    const map = new Map<string, string>();
    if (units) {
      for (const u of units) {
        map.set(u.id, u.identifier);
      }
    }
    return map;
  }, [units]);

  const paymentRentCall = React.useMemo(() => {
    if (!paymentRentCallId || !rentCalls) return null;
    return rentCalls.find((rc) => rc.id === paymentRentCallId) ?? null;
  }, [paymentRentCallId, rentCalls]);

  const monthOptions = React.useMemo(() => getMonthOptions(), []);

  function handleGenerate() {
    setSubmitError(null);
    generateMutation.mutate(selectedMonth, {
      onSuccess: (result) => {
        setBatchResult(result);
        setDialogOpen(false);
      },
      onError: (err) => {
        setSubmitError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      },
    });
  }

  function handleSend() {
    setSendError(null);
    sendMutation.mutate(selectedMonth, {
      onSuccess: (result) => {
        setSendResult(result);
        setSendDialogOpen(false);
      },
      onError: (err) => {
        setSendError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      },
    });
  }

  function handleOpenPaymentDialog(rentCallId: string) {
    setPaymentRentCallId(rentCallId);
    setPaymentDialogOpen(true);
  }

  async function handleRecordPayment(data: {
    amountCents: number;
    paymentMethod: "cash" | "check";
    paymentDate: string;
    payerName: string;
    paymentReference?: string;
  }) {
    if (!paymentRentCallId || isRecordingPayment) return;
    const success = await recordPayment(paymentRentCallId, data, paymentRentCall?.tenantId);
    if (success) {
      setPaymentDialogOpen(false);
      setPaymentRentCallId(null);
    }
  }

  function handleMonthChange(value: string) {
    setSelectedMonth(value);
    setBatchResult(null);
    setSendResult(null);
    setSubmitError(null);
    setSendError(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Appels de loyer
        </h1>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-48" aria-label="Sélectionner le mois">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setSubmitError(null);
              setDialogOpen(true);
            }}
            disabled={
              alreadyGenerated ||
              activeLeases.length === 0 ||
              generateMutation.isPending
            }
          >
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Générer les appels
          </Button>
          {hasUnsent && (
            <Button
              onClick={() => {
                setSendError(null);
                setSendDialogOpen(true);
              }}
              disabled={sendMutation.isPending}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Envoyer par email
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Tous
        </Button>
        <Button
          variant={filter === "unpaid" ? "destructive" : "outline"}
          size="sm"
          onClick={() => setFilter("unpaid")}
        >
          <AlertTriangle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
          Impayés
          {unpaidRentCalls && unpaidRentCalls.length > 0 && (
            <Badge variant="destructive" className="ml-1.5">
              {unpaidRentCalls.length}
            </Badge>
          )}
        </Button>
      </div>

      {filter === "unpaid" && (
        <>
          {isLoadingUnpaid && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          )}
          {isErrorUnpaid && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">
                Erreur lors du chargement des impayés
              </p>
            </div>
          )}
          {!isLoadingUnpaid && !isErrorUnpaid && unpaidRentCalls && (
            <>
              {unpaidRentCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-muted-foreground">
                    Aucun impayé
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidRentCalls.map((rc) => (
                    <Card key={rc.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {rc.tenantType === "company" && rc.tenantCompanyName
                                ? rc.tenantCompanyName
                                : `${rc.tenantFirstName} ${rc.tenantLastName}`}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              — {rc.unitIdentifier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{rc.month}</span>
                            <span>•</span>
                            <span>{formatAmount(rc.remainingBalanceCents ?? rc.totalAmountCents)}</span>
                            {rc.paymentStatus === "partial" && (
                              <Badge variant="secondary" className="text-xs">
                                Partiel
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {rc.daysLate} j de retard
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/rent-calls/${rc.id}`}>
                              Voir détails
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {filter === "all" && batchResult && (
        <div className="mb-6">
          <BatchSummary
            generated={batchResult.generated}
            totalAmountCents={batchResult.totalAmountCents}
            exceptions={batchResult.exceptions}
          />
        </div>
      )}

      {filter === "all" && sendResult && (
        <div className="mb-6">
          <SendBatchSummary
            sent={sendResult.sent}
            failed={sendResult.failed}
            totalAmountCents={sendResult.totalAmountCents}
            failures={sendResult.failures}
          />
        </div>
      )}

      {filter === "all" && isLoadingRentCalls && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {filter === "all" && isErrorRentCalls && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des appels de loyer
          </p>
        </div>
      )}

      {filter === "all" && !isLoadingRentCalls && !isErrorRentCalls && rentCalls && (
        <RentCallList
          rentCalls={rentCalls}
          tenantNames={tenantNames}
          unitIdentifiers={unitIdentifiers}
          onDownloadPdf={downloadPdf}
          downloadingId={downloadingId}
          downloadError={downloadError}
          onRecordPayment={handleOpenPaymentDialog}
          onDownloadReceipt={downloadReceipt}
          receiptDownloadingId={receiptDownloadingId}
          receiptDownloadError={receiptDownloadError}
        />
      )}

      <GenerateRentCallsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleGenerate}
        isPending={generateMutation.isPending}
        month={selectedMonth}
        activeLeaseCount={activeLeases.length}
        submitError={submitError}
      />

      <SendRentCallsDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onConfirm={handleSend}
        isPending={sendMutation.isPending}
        month={selectedMonth}
        unsentCount={unsentRentCalls.length}
        missingEmailCount={missingEmailCount}
        submitError={sendError}
      />

      <RecordManualPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={(v) => {
          setPaymentDialogOpen(v);
          if (!v) setPaymentRentCallId(null);
        }}
        onConfirm={handleRecordPayment}
        isPending={isRecordingPayment}
        defaultPayerName={
          paymentRentCall
            ? (tenantNames.get(paymentRentCall.tenantId) ?? "")
            : ""
        }
        defaultAmountCents={
          paymentRentCall?.paymentStatus === "partial"
            ? (paymentRentCall.remainingBalanceCents ?? paymentRentCall.totalAmountCents)
            : (paymentRentCall?.totalAmountCents ?? 0)
        }
        error={recordPaymentError}
      />
    </div>
  );
}
