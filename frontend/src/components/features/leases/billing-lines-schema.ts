import { z } from "zod";

export const billingLineSchema = z.object({
  chargeCategoryId: z.string().min(1, { error: "Catégorie requise" }),
  amount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
});

export const billingLinesSchema = z.object({
  billingLines: z.array(billingLineSchema).max(50, {
    error: "Maximum 50 lignes de facturation",
  }),
});

export type BillingLinesFormData = z.infer<typeof billingLinesSchema>;
