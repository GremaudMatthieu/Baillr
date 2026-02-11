"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateUnit, useUpdateUnit } from "@/hooks/use-units";
import type { UnitData } from "@/lib/api/units-api";
import { unitSchema, type UnitFormValues } from "./unit-schema";

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  parking: "Parking",
  commercial: "Local commercial",
  storage: "Cave / Garde-meuble",
};

interface UnitFormProps {
  propertyId: string;
  initialData?: UnitData;
  onCancel?: () => void;
}

export function UnitForm({ propertyId, initialData, onCancel }: UnitFormProps) {
  const router = useRouter();
  const createUnit = useCreateUnit(propertyId);
  const updateUnit = useUpdateUnit(initialData?.id ?? "", propertyId);
  const isEditing = !!initialData;

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: initialData
      ? {
          identifier: initialData.identifier,
          type: initialData.type as UnitFormValues["type"],
          floor: initialData.floor ?? undefined,
          surfaceArea: initialData.surfaceArea,
          billableOptions: initialData.billableOptions.length > 0
            ? initialData.billableOptions
            : [],
        }
      : {
          identifier: "",
          type: undefined,
          floor: undefined,
          surfaceArea: undefined as unknown as number,
          billableOptions: [],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "billableOptions",
  });

  const isPending = createUnit.isPending || updateUnit.isPending;

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function onSubmit(data: UnitFormValues) {
    try {
      setSubmitError(null);
      const payload = {
        identifier: data.identifier,
        type: data.type,
        floor:
          data.floor !== undefined && !Number.isNaN(data.floor)
            ? data.floor
            : undefined,
        surfaceArea: data.surfaceArea,
        billableOptions:
          data.billableOptions && data.billableOptions.length > 0
            ? data.billableOptions
            : undefined,
      };

      if (isEditing) {
        await updateUnit.mutateAsync(payload);
      } else {
        const id = crypto.randomUUID();
        await createUnit.mutateAsync({ id, ...payload });
      }
      router.back();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifiant du lot</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Apt 3B, Parking B1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de lot</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="floor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Étage (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex : 3"
                    value={
                      field.value !== undefined && !Number.isNaN(field.value)
                        ? field.value
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : parseInt(val, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="surfaceArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Surface (m²)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex : 65.5"
                    value={
                      field.value !== undefined && !Number.isNaN(field.value)
                        ? field.value
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(
                        val === "" ? undefined : parseFloat(val),
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">
            Options facturables (optionnel)
          </legend>

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-3">
              <FormField
                control={form.control}
                name={`billableOptions.${index}.label`}
                render={({ field: f }) => (
                  <FormItem className="flex-1">
                    {index === 0 && <FormLabel>Libellé</FormLabel>}
                    <FormControl>
                      <Input
                        placeholder="Ex : Entretien chaudière"
                        {...f}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`billableOptions.${index}.amountCents`}
                render={({ field: f }) => (
                  <FormItem className="w-32">
                    {index === 0 && <FormLabel>Montant (€)</FormLabel>}
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          f.value !== undefined && !Number.isNaN(f.value)
                            ? (f.value / 100).toFixed(2)
                            : ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          f.onChange(
                            val === ""
                              ? undefined
                              : Math.round(parseFloat(val) * 100),
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={index === 0 ? "mt-8" : "mt-0"}
                onClick={() => remove(index)}
                aria-label="Supprimer cette option"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", amountCents: 0 })}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
            Ajouter une option
          </Button>
        </fieldset>

        {submitError && (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isEditing ? "Enregistrer" : "Créer le lot"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ?? (() => router.back())}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
