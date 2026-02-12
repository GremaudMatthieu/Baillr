import { z } from "zod";

export const revisionParametersSchema = z.object({
  revisionDay: z
    .number()
    .int({ error: "Jour invalide" })
    .min(1, { error: "Jour invalide" })
    .max(31, { error: "Jour invalide" }),
  revisionMonth: z
    .number()
    .int({ error: "Mois invalide" })
    .min(1, { error: "Mois invalide" })
    .max(12, { error: "Mois invalide" }),
  referenceQuarter: z.enum(["Q1", "Q2", "Q3", "Q4"], {
    error: "Trimestre requis",
  }),
  referenceYear: z
    .number()
    .int({ error: "Année invalide" })
    .min(2000, { error: "Année invalide" })
    .max(2100, { error: "Année invalide" }),
  baseIndexValue: z
    .number()
    .min(0.001, { error: "Indice invalide" })
    .optional(),
});

export type RevisionParametersFormData = z.infer<
  typeof revisionParametersSchema
>;
