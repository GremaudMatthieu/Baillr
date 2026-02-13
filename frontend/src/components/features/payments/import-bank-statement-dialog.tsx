"use client";

import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ColumnMappingForm } from "./column-mapping-form";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";
import type { ColumnMapping } from "@/hooks/use-bank-statements";

interface ImportBankStatementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    file: File,
    bankAccountId: string,
    mapping?: ColumnMapping,
  ) => void;
  isPending: boolean;
  bankAccounts: BankAccountData[];
  submitError?: string | null;
}

const ACCEPTED_TYPES = ".csv,.xlsx,.xls";

export function ImportBankStatementDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  bankAccounts,
  submitError,
}: ImportBankStatementDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bankAccountId, setBankAccountId] = useState<string>("");
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setMapping({});
  };

  const handleConfirm = () => {
    if (!selectedFile || !bankAccountId) return;
    const fullMapping =
      Object.keys(mapping).length > 0
        ? (mapping as ColumnMapping)
        : undefined;
    onConfirm(selectedFile, bankAccountId, fullMapping);
  };

  const handleOpenChange = (v: boolean) => {
    if (!isPending) {
      if (!v) {
        setSelectedFile(null);
        setBankAccountId("");
        setMapping({});
      }
      onOpenChange(v);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Importer un relevé bancaire</AlertDialogTitle>
          <AlertDialogDescription>
            Sélectionnez un fichier CSV ou Excel contenant vos transactions
            bancaires.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* File selection */}
          <div className="grid gap-1.5">
            <Label htmlFor="file-upload">Fichier</Label>
            <div
              className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:border-primary"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cliquez pour sélectionner un fichier (.csv, .xlsx, .xls)
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Bank account selector */}
          <div className="grid gap-1.5">
            <Label htmlFor="bank-account">Compte bancaire</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger id="bank-account">
                <SelectValue placeholder="Sélectionner un compte..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((ba) => (
                  <SelectItem key={ba.id} value={ba.id}>
                    {ba.label}
                    {ba.iban ? ` (${ba.iban.slice(-4)})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column mapping (advanced) */}
          <ColumnMappingForm
            mapping={mapping}
            onChange={setMapping}
          />
        </div>

        {submitError && (
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending || !selectedFile || !bankAccountId}
          >
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isPending ? "Import…" : "Importer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
