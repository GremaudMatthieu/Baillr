"use client";

import { FileSpreadsheet } from "lucide-react";
import type { BankStatementData } from "@/hooks/use-bank-statements";

interface BankStatementListProps {
  statements: BankStatementData[];
  onSelect: (statementId: string) => void;
  selectedId: string | null;
}

export function BankStatementList({
  statements,
  onSelect,
  selectedId,
}: BankStatementListProps) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (statements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        Relevés importés
      </h3>
      <div className="space-y-1">
        {statements.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            aria-selected={selectedId === s.id}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
              selectedId === s.id
                ? "border-primary bg-accent"
                : "border-border"
            }`}
          >
            <FileSpreadsheet
              className="h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(s.importedAt)} — {s.transactionCount} transaction
                {s.transactionCount > 1 ? "s" : ""}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
