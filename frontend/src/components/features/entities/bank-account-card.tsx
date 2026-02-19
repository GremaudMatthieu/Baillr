"use client";

import { Landmark, Banknote, Pencil, Trash2, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BankConnectionBadge } from "@/components/features/bank-connections/bank-connection-badge";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";
import type { BankConnectionData } from "@/lib/api/open-banking-api";

function maskIban(iban: string): string {
  if (iban.length < 6) return iban;
  const country = iban.slice(0, 2);
  const lastFour = iban.slice(-4);
  const middleLength = iban.length - 6;
  const masked = "*".repeat(middleLength);
  // Group in blocks of 4 for readability
  const full = `${country}** ${masked}${lastFour}`;
  return full.replace(/(.{4})/g, "$1 ").trim();
}

const typeLabels: Record<string, string> = {
  bank_account: "Compte bancaire",
  cash_register: "Caisse",
};

interface BankAccountCardProps {
  account: BankAccountData;
  connection?: BankConnectionData | null;
  openBankingAvailable?: boolean;
  onEdit: (account: BankAccountData) => void;
  onRemove: (accountId: string) => void;
  onConnect?: (account: BankAccountData) => void;
}

export function BankAccountCard({
  account,
  connection,
  openBankingAvailable,
  onEdit,
  onRemove,
  onConnect,
}: BankAccountCardProps) {
  const Icon = account.type === "cash_register" ? Banknote : Landmark;
  const showConnectButton =
    openBankingAvailable &&
    account.type === "bank_account" &&
    account.iban &&
    !connection;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Icon
                className="h-5 w-5 text-accent-foreground"
                aria-hidden="true"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{account.label}</CardTitle>
                {account.isDefault && (
                  <Badge variant="secondary">Par défaut</Badge>
                )}
                {connection && (
                  <BankConnectionBadge status={connection.status} />
                )}
              </div>
              <CardDescription>
                {typeLabels[account.type] ?? account.type}
                {account.bankName && ` — ${account.bankName}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            {showConnectButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConnect?.(account)}
                aria-label={`Connecter ${account.label}`}
              >
                <Link2 className="mr-1 h-3 w-3" aria-hidden="true" />
                Connecter ma banque
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(account)}
              aria-label={`Modifier ${account.label}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onRemove(account.id)}
              aria-label={`Supprimer ${account.label}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {account.iban && (
        <CardContent>
          <p className="font-mono text-sm text-muted-foreground">
            {maskIban(account.iban)}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
