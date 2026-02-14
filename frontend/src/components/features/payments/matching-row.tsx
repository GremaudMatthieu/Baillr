"use client";

import { Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  MatchProposal,
  AmbiguousMatch,
  UnmatchedTransaction,
  ConfidenceLevel,
} from "@/hooks/use-bank-statements";
import type { RowStatus } from "@/hooks/use-payment-actions";

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
};

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return (
    <Badge
      variant="outline"
      className={CONFIDENCE_COLORS[level]}
      aria-label={`Confiance ${CONFIDENCE_LABELS[level].toLowerCase()}`}
    >
      {CONFIDENCE_LABELS[level]}
    </Badge>
  );
}

function TransactionSide({
  transaction,
}: {
  transaction: {
    date: string;
    amountCents: number;
    payerName: string | null;
    reference: string | null;
  };
}) {
  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {transaction.payerName ?? "—"}
        </span>
        <span className="text-sm font-semibold">
          {formatAmount(Math.abs(transaction.amountCents))}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatDate(transaction.date)}</span>
        {transaction.reference && (
          <span className="truncate max-w-[200px]">
            {transaction.reference}
          </span>
        )}
      </div>
    </div>
  );
}

function RentCallSide({
  rentCall,
}: {
  rentCall: {
    tenantFirstName: string | null;
    tenantLastName: string | null;
    companyName: string | null;
    unitIdentifier: string;
    totalAmountCents: number;
    month: string;
  };
}) {
  const name =
    rentCall.companyName ??
    ([rentCall.tenantFirstName, rentCall.tenantLastName]
      .filter(Boolean)
      .join(" ") ||
    "—");

  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-sm font-semibold">
          {formatAmount(rentCall.totalAmountCents)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{rentCall.unitIdentifier}</span>
        <span>{rentCall.month}</span>
      </div>
    </div>
  );
}

function getRowClasses(status: RowStatus): string {
  switch (status) {
    case "validated":
      return "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30";
    case "rejected":
      return "border-muted bg-muted/50 opacity-60 [&>:not(:last-child)]:line-through";
    case "assigned":
      return "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30";
    default:
      return "";
  }
}

function getStatusLabel(status: RowStatus): string | null {
  switch (status) {
    case "validated":
      return "Validé";
    case "rejected":
      return "Rejeté";
    case "assigned":
      return "Assigné";
    default:
      return null;
  }
}

interface MatchedRowProps {
  match: MatchProposal;
  status?: RowStatus;
  onValidate?: (transactionId: string, rentCallId: string) => void;
  onReject?: (transactionId: string) => void;
}

export function MatchedRow({
  match,
  status = "default",
  onValidate,
  onReject,
}: MatchedRowProps) {
  const statusLabel = getStatusLabel(status);
  const isActionable = status === "default";
  const isLoading = status === "loading";

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-3 ${getRowClasses(status)}`}
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${match.transaction.payerName ?? ""} rapprochée avec ${match.rentCall.tenantLastName ?? match.rentCall.companyName ?? ""}${statusLabel ? `, ${statusLabel}` : ""}`}
    >
      <TransactionSide transaction={match.transaction} />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-muted-foreground">→</span>
        <ConfidenceBadge level={match.confidence} />
      </div>
      <RentCallSide rentCall={match.rentCall} />
      <div className="flex items-center gap-1">
        {statusLabel && (
          <Badge variant="secondary">{statusLabel}</Badge>
        )}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Chargement" />
        )}
        {isActionable && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
              onClick={() =>
                onValidate?.(match.transactionId, match.rentCallId)
              }
              aria-label="Valider le rapprochement"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={() => onReject?.(match.transactionId)}
              aria-label="Rejeter le rapprochement"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface AmbiguousRowProps {
  match: AmbiguousMatch;
  status?: RowStatus;
  onSelect?: (rentCallId: string) => void;
  onValidate?: (transactionId: string, rentCallId: string) => void;
  onReject?: (transactionId: string) => void;
  selectedRentCallId?: string;
}

export function AmbiguousRow({
  match,
  status = "default",
  onSelect,
  onValidate,
  onReject,
  selectedRentCallId,
}: AmbiguousRowProps) {
  const statusLabel = getStatusLabel(status);
  const isActionable = status === "default";
  const isLoading = status === "loading";

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/30 p-3 ${status !== "default" ? getRowClasses(status) : ""}`}
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${match.transaction.payerName ?? ""} avec plusieurs rapprochements possibles${statusLabel ? `, ${statusLabel}` : ""}`}
    >
      <TransactionSide transaction={match.transaction} />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-muted-foreground">?</span>
        <ConfidenceBadge level={match.confidence} />
      </div>
      <div className="flex-1">
        {isActionable ? (
          <Select onValueChange={onSelect} value={selectedRentCallId}>
            <SelectTrigger
              className="w-full"
              aria-label="Sélectionner le bon rapprochement"
            >
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {match.candidates.map((candidate) => {
                const name =
                  candidate.rentCall.companyName ??
                  ([
                    candidate.rentCall.tenantFirstName,
                    candidate.rentCall.tenantLastName,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                  "—");
                return (
                  <SelectItem
                    key={candidate.rentCallId}
                    value={candidate.rentCallId}
                  >
                    {name} — {candidate.rentCall.unitIdentifier} —{" "}
                    {formatAmount(candidate.rentCall.totalAmountCents)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          statusLabel && <Badge variant="secondary">{statusLabel}</Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Chargement" />
        )}
        {isActionable && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
              disabled={!selectedRentCallId}
              onClick={() =>
                selectedRentCallId &&
                onValidate?.(match.transactionId, selectedRentCallId)
              }
              aria-label="Valider le rapprochement"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={() => onReject?.(match.transactionId)}
              aria-label="Rejeter le rapprochement"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export interface RentCallOption {
  id: string;
  tenantFirstName: string | null;
  tenantLastName: string | null;
  companyName: string | null;
  unitIdentifier: string;
  totalAmountCents: number;
  month: string;
}

interface UnmatchedRowProps {
  transaction: UnmatchedTransaction;
  status?: RowStatus;
  onReject?: (transactionId: string) => void;
  onManualAssign?: (transactionId: string, rentCallId: string) => void;
  availableRentCalls?: RentCallOption[];
  selectedRentCallId?: string;
  onSelectRentCall?: (rentCallId: string) => void;
}

export function UnmatchedRow({
  transaction,
  status = "default",
  onReject,
  onManualAssign,
  availableRentCalls = [],
  selectedRentCallId,
  onSelectRentCall,
}: UnmatchedRowProps) {
  const statusLabel = getStatusLabel(status);
  const isActionable = status === "default";
  const isLoading = status === "loading";

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/30 p-3 ${status !== "default" ? getRowClasses(status) : ""}`}
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${transaction.transaction.payerName ?? ""} sans rapprochement${statusLabel ? `, ${statusLabel}` : ""}`}
    >
      <TransactionSide transaction={transaction.transaction} />
      <div className="flex-1">
        {isActionable && availableRentCalls.length > 0 ? (
          <Select onValueChange={onSelectRentCall} value={selectedRentCallId}>
            <SelectTrigger
              className="w-full"
              aria-label="Assigner à un appel de loyer"
            >
              <SelectValue placeholder="Assigner manuellement..." />
            </SelectTrigger>
            <SelectContent>
              {availableRentCalls.map((rc) => {
                const name =
                  rc.companyName ??
                  ([rc.tenantFirstName, rc.tenantLastName]
                    .filter(Boolean)
                    .join(" ") ||
                  "—");
                return (
                  <SelectItem key={rc.id} value={rc.id}>
                    {name} — {rc.unitIdentifier} —{" "}
                    {formatAmount(rc.totalAmountCents)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : !isActionable && statusLabel ? (
          <Badge variant="secondary">{statusLabel}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            Aucun rapprochement trouvé
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Chargement" />
        )}
        {isActionable && (
          <>
            {availableRentCalls.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                disabled={!selectedRentCallId}
                onClick={() =>
                  selectedRentCallId &&
                  onManualAssign?.(
                    transaction.transactionId,
                    selectedRentCallId,
                  )
                }
                aria-label="Assigner le paiement"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={() => onReject?.(transaction.transactionId)}
              aria-label="Rejeter le rapprochement"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
