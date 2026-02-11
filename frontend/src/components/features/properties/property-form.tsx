"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useCreateProperty, useUpdateProperty } from "@/hooks/use-properties";
import type { PropertyData } from "@/lib/api/properties-api";
import { propertySchema, type PropertyFormValues } from "./property-schema";

interface PropertyFormProps {
  property?: PropertyData;
  onCancel?: () => void;
}

export function PropertyForm({ property, onCancel }: PropertyFormProps) {
  const router = useRouter();
  const { entityId } = useCurrentEntity();
  const createProperty = useCreateProperty(entityId ?? "");
  const updateProperty = useUpdateProperty(property?.id ?? "", entityId ?? "");
  const isEditing = !!property;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          name: property.name,
          type: property.type ?? "",
          address: {
            street: property.addressStreet,
            postalCode: property.addressPostalCode,
            city: property.addressCity,
            country: property.addressCountry,
            complement: property.addressComplement ?? "",
          },
        }
      : {
          name: "",
          type: "",
          address: {
            street: "",
            postalCode: "",
            city: "",
            country: "France",
            complement: "",
          },
        },
  });

  const isPending = createProperty.isPending || updateProperty.isPending;

  const [addressLocked, setAddressLocked] = React.useState(() => {
    return isEditing && !!property?.addressStreet;
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
    form.setValue("address.street", "", { shouldValidate: true });
    form.setValue("address.postalCode", "", { shouldValidate: true });
    form.setValue("address.city", "", { shouldValidate: true });
    form.setValue("address.complement", "", { shouldValidate: true });
    setAddressLocked(false);
  }

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function onSubmit(data: PropertyFormValues) {
    if (!entityId) {
      setSubmitError("Veuillez sélectionner une entité avant de continuer");
      return;
    }
    try {
      setSubmitError(null);
      const address = {
        street: data.address.street,
        postalCode: data.address.postalCode,
        city: data.address.city,
        country: data.address.country || "France",
        complement: data.address.complement || undefined,
      };
      if (isEditing) {
        await updateProperty.mutateAsync({
          name: data.name,
          type: data.type || null,
          address,
        });
      } else {
        const id = crypto.randomUUID();
        await createProperty.mutateAsync({
          id,
          name: data.name,
          type: data.type || undefined,
          address,
        });
      }
      router.back();
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du bien</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : Résidence Les Oliviers"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de bien (optionnel)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : Immeuble, Maison, Local commercial"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    placeholder="Bâtiment B, 3ème étage"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </fieldset>

        {submitError && (
          <p className="text-destructive text-sm" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Loader2
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isEditing ? "Enregistrer" : "Créer le bien"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel ?? (() => router.back())}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
