import { z } from "zod";

export const meterReadingLineSchema = z.object({
  unitId: z.string().min(1, { error: "Lot requis" }),
  previousReading: z
    .number()
    .int({ error: "Valeur entière requise" })
    .min(0, { error: "Valeur doit être positive" })
    .max(99_999_999, { error: "Valeur trop élevée" }),
  currentReading: z
    .number()
    .int({ error: "Valeur entière requise" })
    .min(0, { error: "Valeur doit être positive" })
    .max(99_999_999, { error: "Valeur trop élevée" }),
  readingDate: z.string().min(1, { error: "Date requise" }),
});

export const waterMeterReadingsSchema = z.object({
  readings: z
    .array(meterReadingLineSchema)
    .min(1, { error: "Au moins un relevé requis" })
    .max(200, { error: "Maximum 200 relevés" }),
});

export type WaterMeterReadingsFormData = z.infer<
  typeof waterMeterReadingsSchema
>;
