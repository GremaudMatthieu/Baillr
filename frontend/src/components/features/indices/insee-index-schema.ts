import { z } from "zod";

export const inseeIndexSchema = z.object({
  type: z.enum(["IRL", "ILC", "ICC"], { error: "Type requis" }),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"], { error: "Trimestre requis" }),
  year: z
    .number({ error: "Année requise" })
    .int({ error: "Année doit être un entier" })
    .min(2000, { error: "Année minimum : 2000" })
    .max(2100, { error: "Année maximum : 2100" }),
  value: z
    .number({ error: "Valeur requise" })
    .min(0.001, { error: "La valeur doit être positive" })
    .max(10000, { error: "La valeur ne peut pas dépasser 10 000" }),
});

export type InseeIndexFormData = z.infer<typeof inseeIndexSchema>;
