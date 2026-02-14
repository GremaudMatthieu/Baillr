"use client";

import { useMemo, useState } from "react";
import { Search, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBankStatements,
  useMatchPayments,
  type MatchingResult,
} from "@/hooks/use-bank-statements";
import {
  usePaymentActions,
  type ValidationProgress,
} from "@/hooks/use-payment-actions";
import { getCurrentMonth, getMonthOptions } from "@/lib/month-options";
import {
  MatchedRow,
  AmbiguousRow,
  UnmatchedRow,
  type RentCallOption,
} from "./matching-row";
import {
  ContinuousFlowStepper,
  type FlowStep,
} from "./continuous-flow-stepper";

interface MatchingProposalsContentProps {
  entityId: string;
  hasStatements?: boolean;
}

function MatchingSummaryDisplay({ summary }: { summary: MatchingResult["summary"] }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-medium">
        {summary.matched} rapproché{summary.matched !== 1 ? "s" : ""}
      </span>
      <span className="text-muted-foreground">•</span>
      <span className="text-orange-600 dark:text-orange-400">
        {summary.unmatched} non rapproché{summary.unmatched !== 1 ? "s" : ""}
      </span>
      {summary.ambiguous > 0 && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-yellow-600 dark:text-yellow-400">
            {summary.ambiguous} ambigu{summary.ambiguous !== 1 ? "s" : ""}
          </span>
        </>
      )}
    </div>
  );
}

function ValidationSummaryDisplay({ progress }: { progress: ValidationProgress }) {
  const parts: string[] = [];
  if (progress.validated > 0) {
    parts.push(`${progress.validated} paiement${progress.validated !== 1 ? "s" : ""} validé${progress.validated !== 1 ? "s" : ""}`);
  }
  if (progress.rejected > 0) {
    parts.push(`${progress.rejected} rejeté${progress.rejected !== 1 ? "s" : ""}`);
  }
  if (progress.assigned > 0) {
    parts.push(`${progress.assigned} assigné${progress.assigned !== 1 ? "s" : ""} manuellement`);
  }
  if (parts.length === 0) return null;

  return (
    <div className="rounded-md bg-muted/50 p-3 text-sm" aria-label="Résumé de validation">
      {parts.join(", ")}
    </div>
  );
}

function computeSteps(
  hasStatements: boolean,
  matchResult: MatchingResult | null,
  progress: ValidationProgress,
): FlowStep[] {
  const totalRows = matchResult
    ? matchResult.matches.length +
      matchResult.ambiguous.length +
      matchResult.unmatched.length
    : 0;
  const processedCount =
    progress.validated + progress.rejected + progress.assigned;
  const allProcessed = totalRows > 0 && processedCount >= totalRows;

  return [
    {
      label: "Import",
      status: hasStatements ? "completed" : "pending",
      description: hasStatements ? "Fichier chargé" : undefined,
    },
    {
      label: "Rapprochement",
      status: matchResult
        ? "completed"
        : hasStatements
          ? "active"
          : "pending",
      description: matchResult
        ? `${matchResult.summary.matched} rapprochés, ${matchResult.summary.unmatched} non rapprochés`
        : undefined,
    },
    {
      label: "Validation",
      status: allProcessed
        ? "completed"
        : matchResult
          ? "active"
          : "pending",
      description:
        matchResult && totalRows > 0
          ? `${processedCount}/${totalRows} traités`
          : undefined,
    },
    {
      label: "Terminé",
      status: allProcessed ? "completed" : "pending",
      description: allProcessed ? "Cycle terminé" : undefined,
    },
  ];
}

export function MatchingProposalsContent({
  entityId,
  hasStatements: hasStatementsProp,
}: MatchingProposalsContentProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedStatementId, setSelectedStatementId] = useState<string>("");
  const [ambiguousSelections, setAmbiguousSelections] = useState<Map<string, string>>(new Map());
  const [unmatchedSelections, setUnmatchedSelections] = useState<Map<string, string>>(new Map());

  const { data: bankStatements = [] } = useBankStatements(entityId);
  const { matchPayments, isPending, error, result } =
    useMatchPayments(entityId);
  const {
    handleValidate,
    handleReject,
    handleAssign,
    getRowStatus,
    progress,
    error: actionError,
  } = usePaymentActions(entityId);

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const hasStatements = hasStatementsProp ?? bankStatements.length > 0;

  const handleAmbiguousSelect = (transactionId: string, rentCallId: string) => {
    setAmbiguousSelections((prev) => new Map(prev).set(transactionId, rentCallId));
  };

  const handleUnmatchedSelect = (transactionId: string, rentCallId: string) => {
    setUnmatchedSelections((prev) => new Map(prev).set(transactionId, rentCallId));
  };

  const handleMatch = () => {
    if (!selectedStatementId || !selectedMonth) return;
    void matchPayments(selectedStatementId, selectedMonth);
  };

  const onValidateMatch = (transactionId: string, rentCallId: string) => {
    const matchData = result?.matches.find(
      (m) => m.transactionId === transactionId,
    );
    const ambiguousData = result?.ambiguous.find(
      (a) => a.transactionId === transactionId,
    );
    const tx = matchData?.transaction ?? ambiguousData?.transaction;
    if (!tx) return;

    void handleValidate({
      transactionId,
      rentCallId,
      amountCents: Math.abs(tx.amountCents),
      payerName: tx.payerName ?? "",
      paymentDate: tx.date,
      bankStatementId: selectedStatementId || undefined,
    });
  };

  const onRejectMatch = (transactionId: string) => {
    void handleReject({ transactionId });
  };

  const onManualAssign = (transactionId: string, rentCallId: string) => {
    const unmatchedData = result?.unmatched.find(
      (u) => u.transactionId === transactionId,
    );
    const tx = unmatchedData?.transaction;
    if (!tx) return;

    void handleAssign({
      transactionId,
      rentCallId,
      amountCents: Math.abs(tx.amountCents),
      payerName: tx.payerName ?? "",
      paymentDate: tx.date,
      bankStatementId: selectedStatementId || undefined,
    });
  };

  const sortedMatches = useMemo(() => {
    if (!result) return [];
    return [...result.matches].sort((a, b) => b.score - a.score);
  }, [result]);

  const availableRentCalls: RentCallOption[] = useMemo(() => {
    if (!result) return [];
    return result.availableRentCalls ?? [];
  }, [result]);

  const steps = useMemo(
    () => computeSteps(hasStatements, result, progress),
    [hasStatements, result, progress],
  );

  return (
    <div className="space-y-4">
      <ContinuousFlowStepper steps={steps} />

      <div className="flex items-center gap-2">
        <ArrowRightLeft
          className="h-5 w-5 text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold">Rapprochement</h2>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor="match-statement-select"
            className="text-xs font-medium text-muted-foreground"
          >
            Relevé bancaire
          </label>
          <Select
            value={selectedStatementId}
            onValueChange={setSelectedStatementId}
          >
            <SelectTrigger
              id="match-statement-select"
              className="w-[250px]"
              aria-label="Sélectionner un relevé bancaire"
            >
              <SelectValue placeholder="Sélectionner un relevé..." />
            </SelectTrigger>
            <SelectContent>
              {bankStatements.map((bs) => (
                <SelectItem key={bs.id} value={bs.id}>
                  {bs.fileName} ({bs.transactionCount} transactions)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="match-month-select"
            className="text-xs font-medium text-muted-foreground"
          >
            Mois
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger
              id="match-month-select"
              className="w-[200px]"
              aria-label="Sélectionner le mois"
            >
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
        </div>

        <Button
          onClick={handleMatch}
          disabled={!selectedStatementId || !selectedMonth || isPending}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isPending ? "Rapprochement..." : "Lancer le rapprochement"}
        </Button>
      </div>

      {(error || actionError) && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error ?? actionError}
        </div>
      )}

      {result && result.summary.rentCallCount === 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30 p-4 text-sm text-yellow-800 dark:text-yellow-300">
          <p className="font-medium">Aucun appel de loyer trouvé pour ce mois</p>
          <p className="mt-1 text-yellow-700">
            Générez d&apos;abord vos appels de loyer depuis la page{" "}
            <a href="/rent-calls" className="underline font-medium">Appels de loyer</a>{" "}
            avant de lancer le rapprochement.
          </p>
        </div>
      )}

      {result && result.summary.rentCallCount > 0 && (
        <div className="space-y-4">
          <MatchingSummaryDisplay summary={result.summary} />

          <ValidationSummaryDisplay progress={progress} />

          {sortedMatches.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Propositions de rapprochement">
              <h3 className="text-sm font-medium text-muted-foreground">
                Rapprochements proposés
              </h3>
              {sortedMatches.map((match) => (
                <MatchedRow
                  key={match.transactionId}
                  match={match}
                  status={getRowStatus(match.transactionId)}
                  onValidate={onValidateMatch}
                  onReject={onRejectMatch}
                />
              ))}
            </div>
          )}

          {result.ambiguous.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Rapprochements ambigus">
              <h3 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Rapprochements ambigus
              </h3>
              {result.ambiguous.map((match) => (
                <AmbiguousRow
                  key={match.transactionId}
                  match={match}
                  status={getRowStatus(match.transactionId)}
                  onSelect={(rentCallId) => handleAmbiguousSelect(match.transactionId, rentCallId)}
                  onValidate={onValidateMatch}
                  onReject={onRejectMatch}
                  selectedRentCallId={ambiguousSelections.get(match.transactionId)}
                />
              ))}
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Transactions non rapprochées">
              <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Aucun rapprochement trouvé
              </h3>
              {result.unmatched.map((tx) => (
                <UnmatchedRow
                  key={tx.transactionId}
                  transaction={tx}
                  status={getRowStatus(tx.transactionId)}
                  onReject={onRejectMatch}
                  onManualAssign={onManualAssign}
                  availableRentCalls={availableRentCalls}
                  selectedRentCallId={unmatchedSelections.get(tx.transactionId)}
                  onSelectRentCall={(rcId) => handleUnmatchedSelect(tx.transactionId, rcId)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
