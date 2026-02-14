"use client";

import * as React from "react";
import { Receipt, Mail } from "lucide-react";

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
import type { GenerationResult, SendResult } from "@/lib/api/rent-calls-api";
import { getCurrentMonth, getMonthOptions } from "@/lib/month-options";

interface RentCallsPageContentProps {
  entityId: string;
}

export function RentCallsPageContent({ entityId }: RentCallsPageContentProps) {
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

      {batchResult && (
        <div className="mb-6">
          <BatchSummary
            generated={batchResult.generated}
            totalAmountCents={batchResult.totalAmountCents}
            exceptions={batchResult.exceptions}
          />
        </div>
      )}

      {sendResult && (
        <div className="mb-6">
          <SendBatchSummary
            sent={sendResult.sent}
            failed={sendResult.failed}
            totalAmountCents={sendResult.totalAmountCents}
            failures={sendResult.failures}
          />
        </div>
      )}

      {isLoadingRentCalls && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isErrorRentCalls && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des appels de loyer
          </p>
        </div>
      )}

      {!isLoadingRentCalls && !isErrorRentCalls && rentCalls && (
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
