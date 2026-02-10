"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";

const bankAccountSchema = z.object({
  type: z.enum(["bank_account", "cash_register"]),
  label: z.string().min(1, "Le libellé est requis").max(100),
  iban: z
    .string()
    .regex(/^FR\d{2}[A-Z0-9]{23}$/, "Format IBAN français invalide")
    .optional()
    .or(z.literal("")),
  bic: z
    .string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Format BIC invalide")
    .optional()
    .or(z.literal("")),
  bankName: z.string().max(100).optional().or(z.literal("")),
  isDefault: z.boolean(),
});

type BankAccountFormValues = z.infer<typeof bankAccountSchema>;

interface BankAccountFormProps {
  account?: BankAccountData;
  onSubmit: (data: BankAccountFormValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function BankAccountForm({
  account,
  onSubmit,
  onCancel,
  isPending,
}: BankAccountFormProps) {
  const isEditing = !!account;

  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: account
      ? {
          type: account.type,
          label: account.label,
          iban: account.iban ?? "",
          bic: account.bic ?? "",
          bankName: account.bankName ?? "",
          isDefault: account.isDefault,
        }
      : {
          type: "bank_account",
          label: "",
          iban: "",
          bic: "",
          bankName: "",
          isDefault: false,
        },
  });

  const watchedType = form.watch("type");
  const isCashRegister = watchedType === "cash_register";

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function handleSubmit(data: BankAccountFormValues) {
    // Cross-field validation (can't use .refine() with zodResolver)
    if (data.type === "bank_account" && (!data.iban || data.iban === "")) {
      form.setError("iban", {
        message: "L'IBAN est requis pour un compte bancaire",
      });
      return;
    }

    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de compte</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "cash_register") {
                    form.setValue("iban", "");
                    form.setValue("bic", "");
                    form.setValue("bankName", "");
                    form.setValue("isDefault", false);
                  }
                }}
                defaultValue={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank_account">Compte bancaire</SelectItem>
                  <SelectItem value="cash_register">Caisse</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Libellé</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    isCashRegister ? "Ex : Caisse" : "Ex : Compte courant LCL"
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isCashRegister && (
          <>
            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="FR7630002005500000157845Z02"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.replace(/\s/g, "").toUpperCase(),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BIC (optionnel)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="CRLYFRPP"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value.replace(/\s/g, "").toUpperCase(),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la banque (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex : LCL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {!isCashRegister && (
          <FormField
            control={form.control}
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Compte par défaut pour les appels de loyer
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {submitError && (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isEditing ? "Enregistrer" : "Ajouter"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
