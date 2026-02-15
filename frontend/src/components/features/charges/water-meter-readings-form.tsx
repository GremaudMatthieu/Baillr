"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  waterMeterReadingsSchema,
  type WaterMeterReadingsFormData,
} from "./water-meter-schema";
import type { MeterReadingData } from "@/lib/api/water-meter-api";
import type { UnitData } from "@/lib/api/units-api";

interface WaterMeterReadingsFormProps {
  onSubmit: (readings: MeterReadingData[]) => void;
  isSubmitting: boolean;
  units: UnitData[];
  initialReadings?: MeterReadingData[];
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function WaterMeterReadingsForm({
  onSubmit,
  isSubmitting,
  units,
  initialReadings,
}: WaterMeterReadingsFormProps) {
  const defaultValues = buildDefaults(units, initialReadings);

  const form = useForm<WaterMeterReadingsFormData>({
    resolver: zodResolver(waterMeterReadingsSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "readings",
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(data: WaterMeterReadingsFormData) {
    // Validate currentReading >= previousReading (not in Zod per project convention)
    for (const reading of data.readings) {
      if (reading.currentReading < reading.previousReading) {
        const unit = units.find((u) => u.id === reading.unitId);
        setValidationError(
          `Le relevé actuel du lot "${unit?.identifier ?? reading.unitId}" doit être supérieur ou égal au relevé précédent.`,
        );
        return;
      }
    }

    setValidationError(null);

    const readings: MeterReadingData[] = data.readings.map((r) => ({
      unitId: r.unitId,
      previousReading: r.previousReading,
      currentReading: r.currentReading,
      readingDate: r.readingDate,
    }));

    onSubmit(readings);
  }

  if (units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Aucun lot trouvé pour cette entité. Créez des lots avant de saisir des
        relevés.
      </p>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      noValidate
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                Lot
              </th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                Ancien relevé
              </th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                Nouveau relevé
              </th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                Consommation
              </th>
              <th className="text-right py-2 px-2 font-medium text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const unit = units.find(
                (u) => u.id === form.getValues(`readings.${index}.unitId`),
              );
              const previousReading = form.watch(
                `readings.${index}.previousReading`,
              );
              const currentReading = form.watch(
                `readings.${index}.currentReading`,
              );
              const consumption = Math.max(
                0,
                (currentReading ?? 0) - (previousReading ?? 0),
              );
              const currentError =
                form.formState.errors.readings?.[index]?.currentReading;
              const dateError =
                form.formState.errors.readings?.[index]?.readingDate;

              return (
                <tr key={field.id} className="border-b border-border/50">
                  <td className="py-2 px-2 font-medium">
                    {unit?.identifier ?? "—"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      {...form.register(
                        `readings.${index}.previousReading`,
                        { valueAsNumber: true },
                      )}
                      className="w-28 text-right ml-auto"
                      aria-label={`Ancien relevé ${unit?.identifier ?? ""}`}
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      {...form.register(
                        `readings.${index}.currentReading`,
                        { valueAsNumber: true },
                      )}
                      className="w-28 text-right ml-auto"
                      aria-label={`Nouveau relevé ${unit?.identifier ?? ""}`}
                      aria-invalid={!!currentError}
                    />
                    {currentError && (
                      <p className="mt-1 text-xs text-destructive">
                        {currentError.message as string}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-muted-foreground">
                    {consumption} m³
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input
                      type="date"
                      {...form.register(`readings.${index}.readingDate`)}
                      className="w-36 ml-auto"
                      aria-label={`Date relevé ${unit?.identifier ?? ""}`}
                      aria-invalid={!!dateError}
                    />
                    {dateError && (
                      <p className="mt-1 text-xs text-destructive">
                        {dateError.message as string}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {validationError && (
        <p className="text-sm text-destructive">{validationError}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? "Enregistrement…"
          : "Enregistrer les relevés"}
      </Button>
    </form>
  );
}

function buildDefaults(
  units: UnitData[],
  initialReadings?: MeterReadingData[],
): WaterMeterReadingsFormData {
  const today = getTodayISO();

  return {
    readings: units.map((unit) => {
      const existing = initialReadings?.find((r) => r.unitId === unit.id);
      return {
        unitId: unit.id,
        previousReading: existing?.previousReading ?? 0,
        currentReading: existing?.currentReading ?? 0,
        readingDate: existing?.readingDate
          ? existing.readingDate.split("T")[0]
          : today,
      };
    }),
  };
}
