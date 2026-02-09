"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import type { BanAddressSuggestion } from "@/hooks/use-address-search";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEntity, useUpdateEntity } from "@/hooks/use-entities";
import type { EntityData } from "@/lib/api/entities-api";

const entitySchema = z
  .object({
    type: z.enum(["sci", "nom_propre"]),
    name: z.string().min(1, "Le nom est requis"),
    siret: z
      .string()
      .regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres")
      .optional()
      .or(z.literal("")),
    address: z.object({
      street: z.string().min(1, "L'adresse est requise"),
      postalCode: z
        .string()
        .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres"),
      city: z.string().min(1, "La ville est requise"),
      complement: z.string().optional().or(z.literal("")),
    }),
    legalInformation: z.string().optional(),
  })
  .refine(
    (data) =>
      data.type !== "sci" ||
      (!!data.siret && /^\d{14}$/.test(data.siret)),
    {
      message: "Le SIRET est obligatoire pour une SCI",
      path: ["siret"],
    },
  );

type EntityFormValues = z.infer<typeof entitySchema>;

interface EntityFormProps {
  entity?: EntityData;
}

export function EntityForm({ entity }: EntityFormProps) {
  const router = useRouter();
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const isEditing = !!entity;

  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: entity
      ? {
          type: entity.type as "sci" | "nom_propre",
          name: entity.name,
          siret: entity.siret ?? "",
          address: {
            street: entity.addressStreet,
            postalCode: entity.addressPostalCode,
            city: entity.addressCity,
            complement: entity.addressComplement ?? "",
          },
          legalInformation: entity.legalInformation ?? "",
        }
      : {
          type: "sci",
          name: "",
          siret: "",
          address: {
            street: "",
            postalCode: "",
            city: "",
            complement: "",
          },
          legalInformation: "",
        },
  });

  const isPending = createEntity.isPending || updateEntity.isPending;
  const watchedType = form.watch("type");

  const [addressLocked, setAddressLocked] = React.useState(() => {
    // Lock address fields if editing an entity that already has an address
    return isEditing && !!entity?.addressStreet;
  });

  function handleAddressSelect(suggestion: BanAddressSuggestion) {
    form.setValue("address.street", suggestion.name, { shouldValidate: true });
    form.setValue("address.postalCode", suggestion.postcode, {
      shouldValidate: true,
    });
    form.setValue("address.city", suggestion.city, { shouldValidate: true });
    form.setValue("address.complement", "", { shouldValidate: true });
    setAddressLocked(true);
  }

  function handleAddressReset() {
    form.setValue("address.street", "");
    form.setValue("address.postalCode", "");
    form.setValue("address.city", "");
    form.setValue("address.complement", "");
    setAddressLocked(false);
  }

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function onSubmit(data: EntityFormValues) {
    try {
      setSubmitError(null);
      const address = {
        street: data.address.street,
        postalCode: data.address.postalCode,
        city: data.address.city,
        country: "France",
        complement: data.address.complement || null,
      };
      if (isEditing) {
        await updateEntity.mutateAsync({
          id: entity.id,
          payload: {
            name: data.name,
            siret: data.siret || null,
            address,
            legalInformation: data.legalInformation || null,
          },
        });
      } else {
        const id = crypto.randomUUID();
        await createEntity.mutateAsync({
          id,
          type: data.type,
          name: data.name,
          siret: data.siret || undefined,
          address,
          legalInformation: data.legalInformation || undefined,
        });
      }
      router.push("/entities");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Une erreur est survenue",
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d&apos;entité</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isEditing}
                aria-label={isEditing ? "Type d'entité (non modifiable après création)" : undefined}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sci">SCI</SelectItem>
                  <SelectItem value="nom_propre">Nom propre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom de l&apos;entité</FormLabel>
              <FormControl>
                <Input placeholder="Ex : SCI Les Oliviers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(watchedType === "sci" || (isEditing && form.getValues("siret"))) && (
          <FormField
            control={form.control}
            name="siret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  SIRET{watchedType === "sci" ? "" : " (optionnel)"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="12345678901234"
                    maxLength={14}
                    inputMode="numeric"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Adresse</legend>

          {!addressLocked && (
            <AddressAutocomplete onSelect={handleAddressSelect} />
          )}

          {addressLocked && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Adresse sélectionnée via la recherche
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddressReset}
              >
                <X className="mr-1 h-3 w-3" aria-hidden="true" />
                Modifier
              </Button>
            </div>
          )}

          <FormField
            control={form.control}
            name="address.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rue</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Utilisez la recherche ci-dessus"
                    readOnly
                    tabIndex={-1}
                    className="bg-muted"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="—"
                      readOnly
                      tabIndex={-1}
                      className="bg-muted"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="—"
                      readOnly
                      tabIndex={-1}
                      className="bg-muted"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address.complement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complément d&apos;adresse (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bâtiment B, 3ème étage, porte droite"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        <FormField
          control={form.control}
          name="legalInformation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informations légales (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Capital social, RCS, etc."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isEditing ? "Enregistrer" : "Créer l'entité"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/entities")}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
