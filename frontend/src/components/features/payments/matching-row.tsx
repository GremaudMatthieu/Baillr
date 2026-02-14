"use client";

import { Badge } from "@/components/ui/badge";
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

const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  high: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-orange-100 text-orange-800",
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

export function MatchedRow({ match }: { match: MatchProposal }) {
  return (
    <div
      className="flex items-center gap-4 rounded-lg border p-3"
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${match.transaction.payerName ?? ""} rapprochée avec ${match.rentCall.tenantLastName ?? match.rentCall.companyName ?? ""}`}
    >
      <TransactionSide transaction={match.transaction} />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-muted-foreground">→</span>
        <ConfidenceBadge level={match.confidence} />
      </div>
      <RentCallSide rentCall={match.rentCall} />
    </div>
  );
}

export function AmbiguousRow({
  match,
  onSelect,
}: {
  match: AmbiguousMatch;
  onSelect?: (rentCallId: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3"
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${match.transaction.payerName ?? ""} avec plusieurs rapprochements possibles`}
    >
      <TransactionSide transaction={match.transaction} />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-muted-foreground">?</span>
        <ConfidenceBadge level={match.confidence} />
      </div>
      <div className="flex-1">
        <Select onValueChange={onSelect}>
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
      </div>
    </div>
  );
}

export function UnmatchedRow({
  transaction,
}: {
  transaction: UnmatchedTransaction;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-lg border border-orange-300 bg-orange-50 p-3"
      role="listitem"
      tabIndex={0}
      aria-label={`Transaction ${transaction.transaction.payerName ?? ""} sans rapprochement`}
    >
      <TransactionSide transaction={transaction.transaction} />
      <div className="flex-1 text-center">
        <span className="text-sm text-muted-foreground italic">
          Aucun rapprochement trouvé
        </span>
      </div>
    </div>
  );
}
