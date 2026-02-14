"use client";

import { useState } from "react";
import { Upload, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBankStatements,
  useBankTransactions,
  useImportBankStatement,
  type ImportResult,
  type ColumnMapping,
} from "@/hooks/use-bank-statements";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { ImportBankStatementDialog } from "./import-bank-statement-dialog";
import { ImportSummary } from "./import-summary";
import { BankStatementList } from "./bank-statement-list";
import { TransactionList } from "./transaction-list";
import { MatchingProposalsContent } from "./matching-proposals-content";

interface PaymentsPageContentProps {
  entityId: string;
}

export function PaymentsPageContent({ entityId }: PaymentsPageContentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(
    null,
  );

  const { data: bankStatements = [], isLoading: loadingStatements } =
    useBankStatements(entityId);
  const { data: bankAccounts = [] } = useBankAccounts(entityId);
  const { data: transactions = [] } = useBankTransactions(
    entityId,
    selectedStatementId ?? "",
  );
  const { importStatement, isPending, error: importError } =
    useImportBankStatement(entityId);

  const handleImport = async (
    file: File,
    bankAccountId: string,
    mapping?: ColumnMapping,
  ) => {
    const result = await importStatement(file, bankAccountId, mapping);
    if (result) {
      setImportResult(result);
      setDialogOpen(false);
      setSelectedStatementId(result.bankStatementId);
    }
  };

  const isEmpty = bankStatements.length === 0 && !loadingStatements;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Importer un relevé
        </Button>
      </div>

      {isEmpty && !importResult && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CreditCard
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucun relevé bancaire importé
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Importez votre premier relevé bancaire pour commencer le
            rapprochement.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-4"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Importer un relevé
          </Button>
        </div>
      )}

      {!isEmpty && (
        <div className="space-y-6">
          {importResult && <ImportSummary result={importResult} />}

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
