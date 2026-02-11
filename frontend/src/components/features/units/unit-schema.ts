import { z } from "zod";

export const billableOptionSchema = z.object({
  label: z.string().min(1, "Le libellé est requis").max(100, "100 caractères maximum"),
  amountCents: z
    .number({ error: "Montant requis" })
    .int("Le montant doit être un nombre entier")
    .min(0, "Le montant doit être positif ou zéro"),
});

export const unitSchema = z.object({
  identifier: z
    .string()
    .min(1, "L'identifiant est requis")
    .max(100, "100 caractères maximum"),
  type: z.enum(["apartment", "parking", "commercial", "storage"], {
    error: "Le type est requis",
  }),
  floor: z
    .union([z.number().int("L'étage doit être un nombre entier"), z.nan()])
    .optional(),
  surfaceArea: z
    .number({ error: "La surface est requise" })
    .positive("La surface doit être positive"),
  billableOptions: z.array(billableOptionSchema).optional(),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
