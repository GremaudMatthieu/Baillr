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
import { getCurrentMonth, getMonthOptions } from "@/lib/month-options";
import {
  MatchedRow,
  AmbiguousRow,
  UnmatchedRow,
} from "./matching-row";

interface MatchingProposalsContentProps {
  entityId: string;
}

function MatchingSummaryDisplay({ summary }: { summary: MatchingResult["summary"] }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="font-medium">
        {summary.matched} rapproché{summary.matched !== 1 ? "s" : ""}
      </span>
      <span className="text-muted-foreground">•</span>
      <span className="text-orange-600">
        {summary.unmatched} non rapproché{summary.unmatched !== 1 ? "s" : ""}
      </span>
      {summary.ambiguous > 0 && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-yellow-600">
            {summary.ambiguous} ambigu{summary.ambiguous !== 1 ? "s" : ""}
          </span>
        </>
      )}
    </div>
  );
}

export function MatchingProposalsContent({
  entityId,
}: MatchingProposalsContentProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedStatementId, setSelectedStatementId] = useState<string>("");
  const [ambiguousSelections, setAmbiguousSelections] = useState<Map<string, string>>(new Map());

  const { data: bankStatements = [] } = useBankStatements(entityId);
  const { matchPayments, isPending, error, result } =
    useMatchPayments(entityId);

  const monthOptions = useMemo(() => getMonthOptions(), []);

  const handleAmbiguousSelect = (transactionId: string, rentCallId: string) => {
    setAmbiguousSelections((prev) => new Map(prev).set(transactionId, rentCallId));
  };

  const handleMatch = () => {
    if (!selectedStatementId || !selectedMonth) return;
    void matchPayments(selectedStatementId, selectedMonth);
  };

  const sortedMatches = useMemo(() => {
    if (!result) return [];
    return [...result.matches].sort((a, b) => b.score - a.score);
  }, [result]);

  return (
    <div className="space-y-4">
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

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && result.summary.rentCallCount === 0 && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
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

          {sortedMatches.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Propositions de rapprochement">
              <h3 className="text-sm font-medium text-muted-foreground">
                Rapprochements proposés
              </h3>
              {sortedMatches.map((match) => (
                <MatchedRow key={match.transactionId} match={match} />
              ))}
            </div>
          )}

          {result.ambiguous.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Rapprochements ambigus">
              <h3 className="text-sm font-medium text-yellow-600">
                Rapprochements ambigus
              </h3>
              {result.ambiguous.map((match) => (
                <AmbiguousRow
                key={match.transactionId}
                match={match}
                onSelect={(rentCallId) => handleAmbiguousSelect(match.transactionId, rentCallId)}
              />
              ))}
            </div>
          )}

          {result.unmatched.length > 0 && (
            <div className="space-y-2" role="list" aria-label="Transactions non rapprochées">
              <h3 className="text-sm font-medium text-orange-600">
                Aucun rapprochement trouvé
              </h3>
              {result.unmatched.map((tx) => (
                <UnmatchedRow key={tx.transactionId} transaction={tx} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
