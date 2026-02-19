"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SyncBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (since?: string, until?: string) => void;
  isSyncing: boolean;
  connectionCount: number;
  institutionName: string | null;
}

function getDefaultDates() {
  const now = new Date();
  const until = now.toISOString().split("T")[0];
  const since = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];
  return { since, until };
}

export function SyncBankDialog({
  open,
  onOpenChange,
  onConfirm,
  isSyncing,
  connectionCount,
  institutionName,
}: SyncBankDialogProps) {
  const [useDateRange, setUseDateRange] = useState(false);
  const [since, setSince] = useState(() => getDefaultDates().since);
  const [until, setUntil] = useState(() => getDefaultDates().until);

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    if (useDateRange) {
      onConfirm(since, until);
    } else {
      onConfirm();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setUseDateRange(false);
    }
    onOpenChange(nextOpen);
  };

  const bankLabel = institutionName
    ? institutionName
    : `${connectionCount} connexion${connectionCount > 1 ? "s" : ""}`;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Synchroniser ma banque</AlertDialogTitle>
          <AlertDialogDescription>
            Récupérer les dernières transactions depuis {bankLabel}. Les
            doublons seront automatiquement ignorés.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useDateRange}
              onChange={(e) => setUseDateRange(e.target.checked)}
              className="rounded border-input"
            />
            Limiter à une période
          </label>

          {useDateRange && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 space-y-1">
                <Label htmlFor="sync-since" className="text-xs">
                  Du
                </Label>
                <Input
                  id="sync-since"
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="sync-until" className="text-xs">
                  Au
                </Label>
                <Input
                  id="sync-until"
                  type="date"
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSyncing}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Synchroniser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
