import { z } from "zod";

export const propertySchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  type: z
    .string()
    .max(255, "Le type ne peut pas dépasser 255 caractères")
    .optional()
    .or(z.literal("")),
  address: z.object({
    street: z.string().min(1, "La rue est requise"),
    postalCode: z
      .string()
      .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
    city: z.string().min(1, "La ville est requise"),
    country: z.string().optional().or(z.literal("")),
    complement: z.string().optional().or(z.literal("")),
  }),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
