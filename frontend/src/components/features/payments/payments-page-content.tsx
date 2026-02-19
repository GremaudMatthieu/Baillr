"use client";

import { useState } from "react";
import { Upload, CreditCard, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBankStatements,
  useBankTransactions,
  useImportBankStatement,
  type ImportResult,
  type ColumnMapping,
} from "@/hooks/use-bank-statements";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import {
  useBankConnections,
  useSyncBankConnection,
} from "@/hooks/use-bank-connections";
import { ImportBankStatementDialog } from "./import-bank-statement-dialog";
import { ImportSummary } from "./import-summary";
import { SyncBankSummary } from "./sync-bank-summary";
import { SyncBankDialog } from "./sync-bank-dialog";
import { BankStatementList } from "./bank-statement-list";
import { TransactionList } from "./transaction-list";
import { MatchingProposalsContent } from "./matching-proposals-content";

interface PaymentsPageContentProps {
  entityId: string;
}

interface SyncResultState {
  imported: number;
  institutionName: string | null;
}

export function PaymentsPageContent({ entityId }: PaymentsPageContentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(
    null,
  );
  const [syncResult, setSyncResult] = useState<SyncResultState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: bankStatements = [], isLoading: loadingStatements } =
    useBankStatements(entityId);
  const { data: bankAccounts = [] } = useBankAccounts(entityId);
  const { data: transactions = [] } = useBankTransactions(
    entityId,
    selectedStatementId ?? "",
  );
  const { importStatement, isPending, error: importError } =
    useImportBankStatement(entityId);
  const { data: connections = [] } = useBankConnections(entityId);
  const syncMutation = useSyncBankConnection(entityId);

  const activeConnections = connections.filter((c) => c.status === "linked");
  const hasActiveConnection = activeConnections.length > 0;

  const handleImport = async (
    file: File,
    bankAccountId: string,
    mapping?: ColumnMapping,
  ) => {
    const result = await importStatement(file, bankAccountId, mapping);
    if (result) {
      setImportResult(result);
      setSyncResult(null);
      setDialogOpen(false);
      setSelectedStatementId(result.bankStatementId);
    }
  };

  const handleSync = async (since?: string, until?: string) => {
    setIsSyncing(true);
    setSyncResult(null);
    setImportResult(null);

    let totalImported = 0;
    let lastInstitutionName: string | null = null;

    for (const connection of activeConnections) {
      try {
        const result = await syncMutation.mutateAsync({
          connectionId: connection.id,
          ...(since ? { since } : {}),
          ...(until ? { until } : {}),
        });
        totalImported += result.imported;
        lastInstitutionName = connection.institutionName;
      } catch {
        // Individual connection errors are handled by the mutation
      }
    }

    setSyncResult({
      imported: totalImported,
      institutionName:
        activeConnections.length === 1 ? lastInstitutionName : null,
    });
    setIsSyncing(false);
    setSyncDialogOpen(false);
  };

  const isEmpty = bankStatements.length === 0 && !loadingStatements;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          {hasActiveConnection && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setSyncDialogOpen(true)}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              )}
              Synchroniser ma banque
            </Button>
          )}
          <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Importer un relevé
          </Button>
        </div>
      </div>

      {isEmpty && !importResult && !syncResult && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucun relevé bancaire importé
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveConnection
              ? "Synchronisez votre banque ou importez un relevé pour commencer le rapprochement."
              : "Importez votre premier relevé bancaire pour commencer le rapprochement."}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {hasActiveConnection && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSyncDialogOpen(true)}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                )}
                Synchroniser ma banque
              </Button>
            )}
            <Button className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importer un relevé
            </Button>
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="space-y-6">
          {importResult && <ImportSummary result={importResult} />}
          {syncResult && (
            <SyncBankSummary
              imported={syncResult.imported}
              institutionName={syncResult.institutionName}
            />
          )}

          <BankStatementList
            statements={bankStatements}
            onSelect={setSelectedStatementId}
            selectedId={selectedStatementId}
          />

          {selectedStatementId && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Transactions
              </h3>
              {importResult &&
              selectedStatementId === importResult.bankStatementId ? (
                <TransactionList transactions={importResult.transactions} />
              ) : (
                <TransactionList transactions={transactions} />
              )}
            </div>
          )}

          <hr className="my-6" />

          <MatchingProposalsContent entityId={entityId} hasStatements={bankStatements.length > 0} />
        </div>
      )}

      <SyncBankDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        onConfirm={handleSync}
        isSyncing={isSyncing}
        connectionCount={activeConnections.length}
        institutionName={
          activeConnections.length === 1
            ? activeConnections[0].institutionName
            : null
        }
      />

      <ImportBankStatementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleImport}
        isPending={isPending}
        bankAccounts={bankAccounts}
        submitError={importError}
      />
    </div>
  );
}
