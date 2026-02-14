import { z } from "zod";

export const customChargeSchema = z.object({
  label: z
    .string()
    .min(1, { error: "Libellé requis" })
    .max(100, { error: "Libellé trop long (max 100 caractères)" }),
  amount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
});

export const annualChargesSchema = z.object({
  waterAmount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
  electricityAmount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
  teomAmount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
  cleaningAmount: z
    .number()
    .min(0, { error: "Montant invalide" })
    .max(999999.99, { error: "Montant trop élevé" }),
  customCategories: z.array(customChargeSchema).max(46, {
    error: "Maximum 50 catégories au total",
  }),
});

export type AnnualChargesFormData = z.infer<typeof annualChargesSchema>;
