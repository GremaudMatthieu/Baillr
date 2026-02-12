"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  revisionParametersSchema,
  type RevisionParametersFormData,
} from "./revision-parameters-schema";
import { REFERENCE_QUARTER_LABELS } from "@/lib/constants/reference-quarters";
import { MONTH_LABELS } from "@/lib/constants/months";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { Badge } from "@/components/ui/badge";

interface RevisionParametersFormProps {
  revisionIndexType: string;
  initialValues?: {
    revisionDay: number | null;
    revisionMonth: number | null;
    referenceQuarter: string | null;
    referenceYear: number | null;
    baseIndexValue: number | null;
  };
  onSubmit: (data: RevisionParametersFormData) => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function RevisionParametersForm({
  revisionIndexType,
  initialValues,
  onSubmit,
  onCancel,
  isPending = false,
}: RevisionParametersFormProps) {
  const form = useForm<RevisionParametersFormData>({
    resolver: zodResolver(revisionParametersSchema),
    defaultValues: {
      revisionDay: initialValues?.revisionDay ?? 1,
      revisionMonth: initialValues?.revisionMonth ?? 1,
      referenceQuarter:
        initialValues?.referenceQuarter &&
        ["Q1", "Q2", "Q3", "Q4"].includes(initialValues.referenceQuarter)
          ? (initialValues.referenceQuarter as "Q1" | "Q2" | "Q3" | "Q4")
          : "Q1",
      referenceYear: initialValues?.referenceYear ?? new Date().getFullYear(),
      baseIndexValue: initialValues?.baseIndexValue ?? undefined,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Indice de révision :
        </span>
        <Badge variant="secondary">
          {REVISION_INDEX_TYPE_LABELS[revisionIndexType] ?? revisionIndexType}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="revisionDay">Jour de révision</Label>
          <Select
            value={String(form.watch("revisionDay"))}
            onValueChange={(value) =>
              form.setValue("revisionDay", Number(value))
            }
          >
            <SelectTrigger id="revisionDay">
              <SelectValue placeholder="Jour" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.revisionDay && (
            <p className="text-xs text-destructive">
              {form.formState.errors.revisionDay.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="revisionMonth">Mois de révision</Label>
          <Select
            value={String(form.watch("revisionMonth"))}
            onValueChange={(value) =>
              form.setValue("revisionMonth", Number(value))
            }
          >
            <SelectTrigger id="revisionMonth">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((label, index) => (
                <SelectItem key={index + 1} value={String(index + 1)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.revisionMonth && (
            <p className="text-xs text-destructive">
              {form.formState.errors.revisionMonth.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceQuarter">Trimestre de référence</Label>
          <Select
            value={form.watch("referenceQuarter")}
            onValueChange={(value) =>
              form.setValue(
                "referenceQuarter",
                value as "Q1" | "Q2" | "Q3" | "Q4",
              )
            }
          >
            <SelectTrigger id="referenceQuarter">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REFERENCE_QUARTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.referenceQuarter && (
            <p className="text-xs text-destructive">
              {form.formState.errors.referenceQuarter.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="referenceYear">Année de référence</Label>
          <Input
            id="referenceYear"
            type="number"
            min={2000}
            max={2100}
            {...form.register("referenceYear", { valueAsNumber: true })}
          />
          {form.formState.errors.referenceYear && (
            <p className="text-xs text-destructive">
              {form.formState.errors.referenceYear.message}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="baseIndexValue">
            Indice de base{" "}
            <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="baseIndexValue"
            type="number"
            step="0.001"
            min="0.001"
            placeholder="Ex : 142.06"
            {...form.register("baseIndexValue", { valueAsNumber: true })}
          />
          {form.formState.errors.baseIndexValue && (
            <p className="text-xs text-destructive">
              {form.formState.errors.baseIndexValue.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
