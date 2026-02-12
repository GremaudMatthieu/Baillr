"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useTenants } from "@/hooks/use-tenants";
import { useEntityUnits } from "@/hooks/use-units";
import { useLeases, useCreateLease } from "@/hooks/use-leases";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { leaseSchema, type LeaseFormValues } from "./lease-schema";

export function LeaseForm() {
  const router = useRouter();
  const { entityId } = useCurrentEntity();
  const createLease = useCreateLease(entityId ?? "");
  const { data: tenants } = useTenants(entityId ?? "");
  const { data: units } = useEntityUnits(entityId ?? "");
  const { data: leases } = useLeases(entityId ?? "");

  const vacantUnits = React.useMemo(() => {
    if (!units || !leases) return units ?? [];
    const occupiedUnitIds = new Set(leases.map((l) => l.unitId));
    return units.filter((u) => !occupiedUnitIds.has(u.id));
  }, [units, leases]);

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenantId: "",
      unitId: "",
      startDate: "",
      rentAmount: 0,
      securityDeposit: 0,
      monthlyDueDate: 5,
      revisionIndexType: "IRL",
    },
  });

  const isPending = createLease.isPending;

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  async function onSubmit(data: LeaseFormValues) {
    if (!entityId) {
      setSubmitError("Veuillez sélectionner une entité avant de continuer");
      return;
    }
    try {
      setSubmitError(null);
      const id = crypto.randomUUID();
      await createLease.mutateAsync({
        id,
        tenantId: data.tenantId,
        unitId: data.unitId,
        startDate: new Date(data.startDate).toISOString(),
        rentAmountCents: Math.round(data.rentAmount * 100),
        securityDepositCents: Math.round(data.securityDeposit * 100),
        monthlyDueDate: data.monthlyDueDate,
        revisionIndexType: data.revisionIndexType,
      });
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
          name="tenantId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Locataire</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un locataire" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tenants?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                      {t.companyName ? ` — ${t.companyName}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unitId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lot (vacant)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un lot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vacantUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.identifier} — {u.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loyer mensuel (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="630.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="securityDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dépôt de garantie (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="630.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monthlyDueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jour d&apos;échéance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="revisionIndexType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Indice de révision</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un indice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(REVISION_INDEX_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            Créer le bail
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Form>
  );
}
