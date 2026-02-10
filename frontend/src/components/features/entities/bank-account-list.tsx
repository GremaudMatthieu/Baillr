"use client";

import * as React from "react";
import { Plus, Landmark } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { BankAccountCard } from "./bank-account-card";
import { BankAccountForm } from "./bank-account-form";
import {
  useBankAccounts,
  useAddBankAccount,
  useUpdateBankAccount,
  useRemoveBankAccount,
} from "@/hooks/use-bank-accounts";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";

interface BankAccountListProps {
  entityId: string;
}

export function BankAccountList({ entityId }: BankAccountListProps) {
  const { data: accounts, isLoading, error } = useBankAccounts(entityId);
  const addMutation = useAddBankAccount(entityId);
  const updateMutation = useUpdateBankAccount(entityId);
  const removeMutation = useRemoveBankAccount(entityId);

  const [showForm, setShowForm] = React.useState(false);
  const [editingAccount, setEditingAccount] =
    React.useState<BankAccountData | null>(null);
  const [removingAccountId, setRemovingAccountId] = React.useState<
    string | null
  >(null);

  function handleEdit(account: BankAccountData) {
    setEditingAccount(account);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingAccount(null);
  }

  async function handleSubmit(data: {
    type: "bank_account" | "cash_register";
    label: string;
    iban?: string;
    bic?: string;
    bankName?: string;
    isDefault: boolean;
  }) {
    if (editingAccount) {
      await updateMutation.mutateAsync({
        accountId: editingAccount.id,
        payload: {
          label: data.label,
          iban: data.iban || null,
          bic: data.bic || null,
          bankName: data.bankName || null,
          isDefault: data.isDefault,
        },
      });
    } else {
      const accountId = crypto.randomUUID();
      await addMutation.mutateAsync({
        accountId,
        type: data.type,
        label: data.label,
        iban: data.iban || undefined,
        bic: data.bic || undefined,
        bankName: data.bankName || undefined,
        isDefault: data.isDefault,
      });
    }
    setShowForm(false);
    setEditingAccount(null);
  }

  function handleRemoveConfirm() {
    if (removingAccountId) {
      removeMutation.mutate(removingAccountId);
      setRemovingAccountId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">
          Erreur lors du chargement des comptes bancaires
        </p>
      </div>
    );
  }

  const removingAccount = accounts?.find((a) => a.id === removingAccountId);

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="max-w-2xl">
          <h2 className="mb-4 text-lg font-semibold">
            {editingAccount ? "Modifier le compte" : "Ajouter un compte"}
          </h2>
          <BankAccountForm
            account={editingAccount ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isPending={addMutation.isPending || updateMutation.isPending}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {accounts?.length
                ? `${accounts.length} compte${accounts.length > 1 ? "s" : ""}`
                : "Aucun compte bancaire"}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un compte
            </Button>
          </div>

          {accounts && accounts.length > 0 ? (
            <ul className="list-none space-y-4" aria-label="Comptes bancaires">
              {accounts.map((account) => (
                <li key={account.id}>
                  <BankAccountCard
                    account={account}
                    onEdit={handleEdit}
                    onRemove={setRemovingAccountId}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Landmark
                className="h-10 w-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                Aucun compte bancaire configuré
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajoutez un compte pour que vos appels de loyer affichent
                l&apos;IBAN correct
              </p>
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={!!removingAccountId}
        onOpenChange={(open) => !open && setRemovingAccountId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer le compte &quot;
              {removingAccount?.label}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
