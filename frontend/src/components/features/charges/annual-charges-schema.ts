import { z } from "zod";

export const chargeLineSchema = z.object({
  chargeCategoryId: z.string().min(1, { error: "Catégorie requise" }),
  amount: z
    .number()
    .min(0.01, { error: "Montant doit être supérieur à 0" })
    .max(999999.99, { error: "Montant trop élevé" }),
});

export const annualChargesSchema = z.object({
  charges: z
    .array(chargeLineSchema)
    .min(1, { error: "Au moins une charge requise" })
    .max(50, { error: "Maximum 50 catégories" }),
});

export type AnnualChargesFormData = z.infer<typeof annualChargesSchema>;
