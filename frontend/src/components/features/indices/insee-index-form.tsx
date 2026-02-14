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
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { REFERENCE_QUARTER_LABELS } from "@/lib/constants/reference-quarters";
import {
  inseeIndexSchema,
  type InseeIndexFormData,
} from "./insee-index-schema";

interface InseeIndexFormProps {
  onSubmit: (data: InseeIndexFormData) => void;
  isSubmitting?: boolean;
}

export function InseeIndexForm({ onSubmit, isSubmitting }: InseeIndexFormProps) {
  const form = useForm<InseeIndexFormData>({
    resolver: zodResolver(inseeIndexSchema),
    defaultValues: {
      type: "IRL",
      quarter: "Q1",
      year: new Date().getFullYear(),
      value: undefined,
    },
  });

  const handleSubmit = (data: InseeIndexFormData) => {
    onSubmit(data);
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-4"
      aria-label="Formulaire d'enregistrement d'indice INSEE"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type d&apos;indice</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) =>
              form.setValue("type", value as "IRL" | "ILC" | "ICC")
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REVISION_INDEX_TYPE_LABELS).map(
                ([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          {form.formState.errors.type && (
            <p className="text-xs text-destructive">
              {form.formState.errors.type.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quarter">Trimestre</Label>
          <Select
            value={form.watch("quarter")}
            onValueChange={(value) =>
              form.setValue("quarter", value as "Q1" | "Q2" | "Q3" | "Q4")
            }
          >
            <SelectTrigger id="quarter">
              <SelectValue placeholder="Sélectionner un trimestre" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(REFERENCE_QUARTER_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.quarter && (
            <p className="text-xs text-destructive">
              {form.formState.errors.quarter.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Année</Label>
          <Input
            id="year"
            type="number"
            min={2000}
            max={2100}
            {...form.register("year", { valueAsNumber: true })}
          />
          {form.formState.errors.year && (
            <p className="text-xs text-destructive">
              {form.formState.errors.year.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Valeur</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            min="0.001"
            max="500"
            placeholder="Ex: 142.06"
            {...form.register("value", { valueAsNumber: true })}
          />
          {form.formState.errors.value && (
            <p className="text-xs text-destructive">
              {form.formState.errors.value.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement…" : "Enregistrer l'indice"}
      </Button>
    </form>
  );
}
