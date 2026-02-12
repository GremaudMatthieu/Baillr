"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRegisterTenant, useUpdateTenant } from "@/hooks/use-tenants";
import type { TenantData } from "@/lib/api/tenants-api";
import { TENANT_TYPE_LABELS } from "@/lib/constants/tenant-types";
import { tenantSchema, type TenantFormValues } from "./tenant-schema";

interface TenantFormProps {
  tenant?: TenantData;
  onCancel?: () => void;
}

export function TenantForm({ tenant, onCancel }: TenantFormProps) {
  const router = useRouter();
  const { entityId } = useCurrentEntity();
  const registerTenant = useRegisterTenant(entityId ?? "");
  const updateTenant = useUpdateTenant(tenant?.id ?? "", entityId ?? "");
  const isEditing = !!tenant;

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: tenant
      ? {
          type: tenant.type,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          companyName: tenant.companyName ?? "",
          siret: tenant.siret ?? "",
          email: tenant.email,
          phoneNumber: tenant.phoneNumber ?? "",
          address: {
            street: tenant.addressStreet ?? "",
            postalCode: tenant.addressPostalCode ?? "",
            city: tenant.addressCity ?? "",
            complement: tenant.addressComplement ?? "",
          },
        }
      : {
          type: "",
          firstName: "",
          lastName: "",
          companyName: "",
          siret: "",
          email: "",
          phoneNumber: "",
          address: {
            street: "",
            postalCode: "",
            city: "",
            complement: "",
          },
        },
  });

  const isPending = registerTenant.isPending || updateTenant.isPending;
  const watchedType = form.watch("type");
  const isCompany = watchedType === "company";

  const [addressLocked, setAddressLocked] = React.useState(() => {
    return isEditing && !!tenant?.addressStreet;
  });

  function handleAddressSelect(suggestion: BanAddressSuggestion) {
    form.setValue("address.street", suggestion.name, {
      shouldValidate: true,
    });
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

  async function onSubmit(data: TenantFormValues) {
    if (!entityId) {
      setSubmitError("Veuillez sélectionner une entité avant de continuer");
      return;
    }
    try {
      setSubmitError(null);
      const address =
        data.address.street || data.address.postalCode || data.address.city
          ? {
              street: data.address.street || undefined,
              postalCode: data.address.postalCode || undefined,
              city: data.address.city || undefined,
              complement: data.address.complement || undefined,
            }
          : undefined;

      if (isEditing) {
        await updateTenant.mutateAsync({
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName || null,
          siret: data.siret || null,
          email: data.email,
          phoneNumber: data.phoneNumber || null,
          address,
        });
      } else {
        const id = crypto.randomUUID();
        await registerTenant.mutateAsync({
          id,
          type: data.type,
          firstName: data.firstName,
          lastName: data.lastName,
          companyName: data.companyName || undefined,
          siret: data.siret || undefined,
          email: data.email,
          phoneNumber: data.phoneNumber || undefined,
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de locataire</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditing}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TENANT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isCompany && (
          <>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l&apos;entreprise</FormLabel>
                  <FormControl>
                    <Input placeholder="SCI Les Oliviers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="siret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SIRET (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="jean.dupont@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="+33612345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Adresse (optionnel)</legend>

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
                  <Input placeholder="Bâtiment B, 3ème étage" {...field} />
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
            {isEditing ? "Enregistrer" : "Enregistrer le locataire"}
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
