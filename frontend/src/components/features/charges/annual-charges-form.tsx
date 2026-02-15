"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  annualChargesSchema,
  type AnnualChargesFormData,
} from "./annual-charges-schema";
import type { ChargeEntryData } from "@/lib/api/annual-charges-api";
import type { ChargeCategoryData } from "@/lib/api/charge-categories-api";

interface AnnualChargesFormProps {
  onSubmit: (charges: ChargeEntryData[]) => void;
  isSubmitting: boolean;
  initialCharges?: ChargeEntryData[];
  chargeCategories: ChargeCategoryData[];
  onCreateCategory?: (label: string) => Promise<ChargeCategoryData>;
}

export function AnnualChargesForm({
  onSubmit,
  isSubmitting,
  initialCharges,
  chargeCategories,
  onCreateCategory,
}: AnnualChargesFormProps) {
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const defaultValues = buildDefaults(initialCharges, chargeCategories);

  const form = useForm<AnnualChargesFormData>({
    resolver: zodResolver(annualChargesSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "charges",
  });

  const watchedCharges = form.watch("charges");
  const usedCategoryIds = new Set(
    watchedCharges?.map((c) => c.chargeCategoryId).filter(Boolean) ?? [],
  );

  const availableCategories = chargeCategories.filter(
    (cat) => !usedCategoryIds.has(cat.id),
  );

  function handleSubmit(data: AnnualChargesFormData) {
    const charges: ChargeEntryData[] = data.charges
      .filter((c) => c.chargeCategoryId)
      .map((c) => {
        const cat = chargeCategories.find((cc) => cc.id === c.chargeCategoryId);
        return {
          chargeCategoryId: c.chargeCategoryId,
          label: cat?.label ?? "",
          amountCents: Math.round(c.amount * 100),
        };
      });

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
          Charges par catégorie
        </legend>

        {fields.map((field, index) => {
          const categoryError =
            form.formState.errors.charges?.[index]?.chargeCategoryId;
          const amountError =
            form.formState.errors.charges?.[index]?.amount;

          const currentCategoryId = watchedCharges?.[index]?.chargeCategoryId;
          const currentCategory = chargeCategories.find(
            (cc) => cc.id === currentCategoryId,
          );

          return (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Label
                  htmlFor={`charges.${index}.chargeCategoryId`}
                  className="sr-only"
                >
                  Catégorie
                </Label>
                <Select
                  value={currentCategoryId || ""}
                  onValueChange={(value) => {
                    form.setValue(
                      `charges.${index}.chargeCategoryId`,
                      value,
                      { shouldValidate: true },
                    );
                  }}
                >
                  <SelectTrigger
                    id={`charges.${index}.chargeCategoryId`}
                    aria-invalid={!!categoryError}
                    aria-label={`Catégorie ligne ${index + 1}`}
                  >
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {chargeCategories.map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        disabled={
                          usedCategoryIds.has(cat.id) &&
                          cat.id !== currentCategoryId
                        }
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryError && (
                  <p className="mt-1 text-xs text-destructive">
                    {categoryError.message as string}
                  </p>
                )}
              </div>
              <div className="w-32">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register(`charges.${index}.amount`, {
                    valueAsNumber: true,
                  })}
                  className="text-right"
                  aria-label={`Montant ligne ${index + 1}`}
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
                aria-label={`Supprimer ${currentCategory?.label ?? `ligne ${index + 1}`}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          );
        })}

        <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end">
          {availableCategories.length > 0 && (
            <div className="flex-1">
              <Label className="mb-1 text-xs text-muted-foreground">
                Catégorie existante
              </Label>
              <Select
                value=""
                onValueChange={(categoryId) => {
                  append({ chargeCategoryId: categoryId, amount: 0 });
                }}
              >
                <SelectTrigger aria-label="Ajouter une catégorie existante">
                  <SelectValue placeholder="Ajouter une catégorie…" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {onCreateCategory && (
            <div className="flex flex-1 items-end gap-2">
              <div className="flex-1">
                <Label className="mb-1 text-xs text-muted-foreground">
                  Nouvelle catégorie
                </Label>
                <Input
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Nom…"
                  aria-label="Nom de la nouvelle catégorie"
                  disabled={isCreating}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isCreating || !newCategoryLabel.trim()}
                onClick={async () => {
                  const label = newCategoryLabel.trim();
                  if (!label || !onCreateCategory) return;
                  setIsCreating(true);
                  try {
                    const created = await onCreateCategory(label);
                    setNewCategoryLabel("");
                    append({ chargeCategoryId: created.id, amount: 0 });
                  } finally {
                    setIsCreating(false);
                  }
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                {isCreating ? "Création…" : "Créer"}
              </Button>
            </div>
          )}
        </div>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement…" : "Enregistrer les charges"}
      </Button>
    </form>
  );
}

function buildDefaults(
  initialCharges?: ChargeEntryData[],
  chargeCategories?: ChargeCategoryData[],
): AnnualChargesFormData {
  if (!initialCharges || initialCharges.length === 0) {
    return { charges: [] };
  }

  return {
    charges: initialCharges.map((charge) => ({
      chargeCategoryId: charge.chargeCategoryId,
      amount: charge.amountCents / 100,
    })),
  };
}
