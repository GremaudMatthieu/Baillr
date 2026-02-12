import { z } from "zod";

export const billingLineSchema = z.object({
  label: z
    .string()
    .min(1, { error: "Libellé requis" })
    .max(100, { error: "Libellé trop long (max 100 caractères)" }),
  amount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
  type: z.enum(["provision", "option"], {
    error: "Type requis",
  }),
});

export const billingLinesSchema = z.object({
  billingLines: z.array(billingLineSchema).max(50, {
    error: "Maximum 50 lignes de facturation",
  }),
});

export type BillingLinesFormData = z.infer<typeof billingLinesSchema>;
