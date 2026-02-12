import { z } from "zod";

export const leaseSchema = z.object({
  tenantId: z.string().min(1, "Locataire requis"),
  unitId: z.string().min(1, "Lot requis"),
  startDate: z.string().min(1, "Date de début requise"),
  rentAmount: z
    .number({ error: "Loyer requis" })
    .positive("Loyer doit être positif")
    .max(999999.99, "Montant trop élevé"),
  securityDeposit: z
    .number({ error: "Dépôt de garantie requis" })
    .min(0, "Dépôt de garantie invalide")
    .max(999999.99, "Montant trop élevé"),
  monthlyDueDate: z
    .number({ error: "Jour d'échéance requis" })
    .int("Jour invalide")
    .min(1, "Jour invalide")
    .max(31, "Jour invalide"),
  revisionIndexType: z.enum(["IRL", "ILC", "ICC"], {
    error: "Type d'indice requis",
  }),
});

export type LeaseFormValues = z.infer<typeof leaseSchema>;
