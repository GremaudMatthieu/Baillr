import { z } from "zod";

export const tenantSchema = z.object({
  type: z.string().min(1, "Le type de locataire est requis"),
  firstName: z
    .string()
    .min(1, "Le prénom est requis")
    .max(100, "Le prénom ne peut pas dépasser 100 caractères"),
  lastName: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  companyName: z
    .string()
    .max(255, "Le nom de l\u2019entreprise ne peut pas dépasser 255 caractères")
    .optional()
    .or(z.literal("")),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "L\u2019email est requis")
    .email("Email invalide")
    .max(255, "L\u2019email ne peut pas dépasser 255 caractères"),
  phoneNumber: z
    .string()
    .regex(
      /^(\+33|0)[1-9]\d{8}$/,
      "Le numéro doit être au format français (ex : +33612345678)",
    )
    .optional()
    .or(z.literal("")),
  address: z.object({
    street: z
      .string()
      .max(255, "La rue ne peut pas dépasser 255 caractères")
      .optional()
      .or(z.literal("")),
    postalCode: z
      .string()
      .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres")
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .max(100, "La ville ne peut pas dépasser 100 caractères")
      .optional()
      .or(z.literal("")),
    complement: z
      .string()
      .max(255, "Le complément ne peut pas dépasser 255 caractères")
      .optional()
      .or(z.literal("")),
  }),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;
