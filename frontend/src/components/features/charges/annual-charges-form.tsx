"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CHARGE_CATEGORY_LABELS,
  FIXED_CATEGORIES,
} from "@/lib/constants/charge-categories";
import {
  annualChargesSchema,
  type AnnualChargesFormData,
} from "./annual-charges-schema";
import type { ChargeEntryData } from "@/lib/api/annual-charges-api";

interface AnnualChargesFormProps {
  onSubmit: (charges: ChargeEntryData[]) => void;
  isSubmitting: boolean;
  initialCharges?: ChargeEntryData[];
}

export function AnnualChargesForm({
  onSubmit,
  isSubmitting,
  initialCharges,
}: AnnualChargesFormProps) {
  const defaultValues = buildDefaults(initialCharges);

  const form = useForm<AnnualChargesFormData>({
    resolver: zodResolver(annualChargesSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customCategories",
  });

  function handleSubmit(data: AnnualChargesFormData) {
    const charges: ChargeEntryData[] = [];

    for (const cat of FIXED_CATEGORIES) {
      const key = `${cat}Amount` as keyof AnnualChargesFormData;
      const amount = data[key] as number;
      charges.push({
        category: cat,
        label: CHARGE_CATEGORY_LABELS[cat],
        amountCents: Math.round(amount * 100),
      });
    }

    for (const custom of data.customCategories) {
      charges.push({
        category: "custom",
        label: custom.label.trim(),
        amountCents: Math.round(custom.amount * 100),
      });
    }

    onSubmit(charges);
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      noValidate
    >
      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          Catégories de charges
        </legend>

        {FIXED_CATEGORIES.map((cat) => {
          const key = `${cat}Amount` as keyof AnnualChargesFormData;
          const label = CHARGE_CATEGORY_LABELS[cat];
          const error = form.formState.errors[key];
          return (
            <div key={cat} className="flex items-center gap-4">
              <Label htmlFor={key} className="w-32 text-sm shrink-0">
                {label}
              </Label>
              <div className="flex-1">
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...form.register(key, { valueAsNumber: true })}
                  className="text-right"
                  aria-invalid={!!error}
                />
                {error && (
                  <p className="mt-1 text-xs text-destructive">
                    {error.message as string}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          );
        })}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">
          Catégories personnalisées
        </legend>

        {fields.map((field, index) => {
          const labelError =
            form.formState.errors.customCategories?.[index]?.label;
          const amountError =
            form.formState.errors.customCategories?.[index]?.amount;
          return (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Libellé"
                  {...form.register(`customCategories.${index}.label`)}
                  aria-label={`Libellé catégorie personnalisée ${index + 1}`}
                  aria-invalid={!!labelError}
                />
                {labelError && (
                  <p className="mt-1 text-xs text-destructive">
                    {labelError.message as string}
                  </p>
                )}
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...form.register(`customCategories.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                  className="text-right"
                  aria-label={`Montant catégorie personnalisée ${index + 1}`}
                  aria-invalid={!!amountError}
                />
                {amountError && (
                  <p className="mt-1 text-xs text-destructive">
                    {amountError.message as string}
                  </p>
                )}
              </div>
              <span className="text-sm text-muted-foreground pt-2">€</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label={`Supprimer catégorie personnalisée ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ label: "", amount: 0 })}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une catégorie
        </Button>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Enregistrement…"
          : "Enregistrer les charges"}
      </Button>
    </form>
  );
}

function buildDefaults(
  initialCharges?: ChargeEntryData[],
): AnnualChargesFormData {
  if (!initialCharges || initialCharges.length === 0) {
    return {
      waterAmount: 0,
      electricityAmount: 0,
      teomAmount: 0,
      cleaningAmount: 0,
      customCategories: [],
    };
  }

  const defaults: AnnualChargesFormData = {
    waterAmount: 0,
    electricityAmount: 0,
    teomAmount: 0,
    cleaningAmount: 0,
    customCategories: [],
  };

  for (const charge of initialCharges) {
    const amountEuros = charge.amountCents / 100;
    switch (charge.category) {
      case "water":
        defaults.waterAmount = amountEuros;
        break;
      case "electricity":
        defaults.electricityAmount = amountEuros;
        break;
      case "teom":
        defaults.teomAmount = amountEuros;
        break;
      case "cleaning":
        defaults.cleaningAmount = amountEuros;
        break;
      case "custom":
        defaults.customCategories.push({
          label: charge.label,
          amount: amountEuros,
        });
        break;
    }
  }

  return defaults;
}
