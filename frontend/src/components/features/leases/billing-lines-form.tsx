"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

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
  billingLinesSchema,
  type BillingLinesFormData,
} from "./billing-lines-schema";
import type { BillingLineData } from "@/lib/api/leases-api";

interface BillingLinesFormProps {
  initialLines: BillingLineData[];
  rentAmountCents: number;
  unitBillableOptions?: Array<{ label: string; amountCents: number }>;
  onSubmit: (billingLines: BillingLineData[]) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function BillingLinesForm({
  initialLines,
  rentAmountCents,
  unitBillableOptions = [],
  onSubmit,
  onCancel,
  isPending = false,
}: BillingLinesFormProps) {
  const form = useForm<BillingLinesFormData>({
    resolver: zodResolver(billingLinesSchema),
    defaultValues: {
      billingLines: initialLines.map((line) => ({
        label: line.label,
        amount: line.amountCents / 100,
        type: line.type as "provision" | "option",
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "billingLines",
  });

  function handleSubmit(data: BillingLinesFormData) {
    const billingLines: BillingLineData[] = data.billingLines.map((line) => ({
      label: line.label,
      amountCents: Math.round(line.amount * 100),
      type: line.type,
    }));
    onSubmit(billingLines);
  }

  function handleAddProvision() {
    append({ label: "", amount: 0, type: "provision" });
  }

  function handleAddFromOption(opt: { label: string; amountCents: number }) {
    append({ label: opt.label, amount: opt.amountCents / 100, type: "option" });
  }

  const additionalTotal = form.watch("billingLines").reduce(
    (sum, line) => sum + (line.amount || 0),
    0,
  );
  const total = rentAmountCents / 100 + additionalTotal;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="sr-only">Lignes de facturation</legend>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[1fr_40px] gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_120px_140px_40px] sm:border-0 sm:p-0"
          >
            <div className="sm:contents">
              <div>
                <Label htmlFor={`billingLines.${index}.label`} className="mb-1 text-xs text-muted-foreground sm:sr-only">
                  Libellé
                </Label>
                <Input
                  id={`billingLines.${index}.label`}
                  placeholder="Libellé"
                  {...form.register(`billingLines.${index}.label`)}
                />
                {form.formState.errors.billingLines?.[index]?.label && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.billingLines[index].label.message}
                  </p>
                )}
              </div>

              <div className="col-start-2 row-start-1 sm:col-auto sm:row-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label={`Supprimer ${form.getValues(`billingLines.${index}.label`) || "ligne"}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="col-span-2 grid grid-cols-[1fr_1fr] gap-2 sm:contents">
                <div>
                  <Label
                    htmlFor={`billingLines.${index}.amount`}
                    className="mb-1 text-xs text-muted-foreground sm:sr-only"
                  >
                    Montant (€)
                  </Label>
                  <Input
                    id={`billingLines.${index}.amount`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...form.register(`billingLines.${index}.amount`, {
                      valueAsNumber: true,
                    })}
                  />
                  {form.formState.errors.billingLines?.[index]?.amount && (
                    <p className="mt-1 text-xs text-destructive">
                      {form.formState.errors.billingLines[index].amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`billingLines.${index}.type`} className="mb-1 text-xs text-muted-foreground sm:sr-only">
                    Type
                  </Label>
                  <Select
                    value={form.watch(`billingLines.${index}.type`)}
                    onValueChange={(value) =>
                      form.setValue(
                        `billingLines.${index}.type`,
                        value as "provision" | "option",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provision">Provision</SelectItem>
                      <SelectItem value="option">Option</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleAddProvision}>
          <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
          Ajouter une provision
        </Button>

        {unitBillableOptions.length > 0 && (
          <>
            {unitBillableOptions.map((opt) => (
              <Button
                key={opt.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddFromOption(opt)}
              >
                <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                {opt.label} ({formatCurrency(opt.amountCents / 100)})
              </Button>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">
          Total mensuel : <span className="text-lg">{formatCurrency(total)}</span>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-initial">
            Annuler
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1 sm:flex-initial">
            {isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
