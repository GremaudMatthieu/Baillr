"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Euro,
  Hash,
  Settings,
  ClipboardEdit,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLease,
  useConfigureBillingLines,
  useConfigureRevisionParameters,
} from "@/hooks/use-leases";
import { useUnit } from "@/hooks/use-units";
import { useTenant } from "@/hooks/use-tenants";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { BILLING_LINE_TYPE_LABELS } from "@/lib/constants/billing-line-types";
import { BillingLinesForm } from "./billing-lines-form";
import { RevisionParametersForm } from "./revision-parameters-form";
import type { RevisionParametersFormData } from "./revision-parameters-schema";
import { REFERENCE_QUARTER_LABELS } from "@/lib/constants/reference-quarters";
import { MONTH_LABELS } from "@/lib/constants/months";
import type { BillingLineData } from "@/lib/api/leases-api";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

const TYPE_BADGE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  rent: "default",
  provision: "secondary",
  option: "outline",
};

export function LeaseDetailContent({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const { data: lease, isLoading, isError } = useLease(leaseId);
  const { data: tenant } = useTenant(lease?.tenantId ?? "");
  const { data: unit } = useUnit(lease?.unitId ?? "");
  const [isEditingBillingLines, setIsEditingBillingLines] = useState(false);
  const [isEditingRevisionParameters, setIsEditingRevisionParameters] =
    useState(false);

  const configureBillingLines = useConfigureBillingLines(
    leaseId,
    lease?.entityId ?? "",
  );

  const configureRevisionParameters = useConfigureRevisionParameters(
    leaseId,
    lease?.entityId ?? "",
  );

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !lease) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Bail introuvable</p>
      </div>
    );
  }

  const tenantName = tenant
    ? `${tenant.firstName} ${tenant.lastName}`
    : "Chargement…";

  const billingLines: BillingLineData[] = (lease.billingLines ?? []) as BillingLineData[];
  const rentCents = lease.rentAmountCents;
  const additionalCents = billingLines.reduce(
    (sum, line) => sum + line.amountCents,
    0,
  );
  const totalCents = rentCents + additionalCents;

  function handleRevisionParametersSave(data: RevisionParametersFormData) {
    configureRevisionParameters.mutate(
      {
        revisionDay: data.revisionDay,
        revisionMonth: data.revisionMonth,
        referenceQuarter: data.referenceQuarter,
        referenceYear: data.referenceYear,
        baseIndexValue: data.baseIndexValue ?? null,
      },
      {
        onSuccess: () => setIsEditingRevisionParameters(false),
      },
    );
  }

  function handleBillingLinesSave(lines: BillingLineData[]) {
    configureBillingLines.mutate(lines, {
      onSuccess: () => setIsEditingBillingLines(false),
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Bail — {tenantName}
        </h1>
        <Badge variant="secondary">{lease.revisionIndexType}</Badge>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du bail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Locataire
              </p>
              <p>{tenantName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Date de début
              </p>
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {formatDate(lease.startDate)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Loyer mensuel
              </p>
              <p className="flex items-center gap-1">
                <Euro className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {formatCurrency(lease.rentAmountCents)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Dépôt de garantie
              </p>
              <p>{formatCurrency(lease.securityDepositCents)}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Jour d&apos;échéance
              </p>
              <p className="flex items-center gap-1">
                <Hash className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {lease.monthlyDueDate} du mois
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Indice de révision
              </p>
              <p>
                {REVISION_INDEX_TYPE_LABELS[lease.revisionIndexType] ??
                  lease.revisionIndexType}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">
              Paramètres de révision
            </CardTitle>
            {!isEditingRevisionParameters && lease.revisionDay !== null && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingRevisionParameters(true)}
                className="w-full sm:w-auto"
              >
                <ClipboardEdit
                  className="mr-1 h-3 w-3"
                  aria-hidden="true"
                />
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingRevisionParameters ? (
              <RevisionParametersForm
                revisionIndexType={lease.revisionIndexType}
                initialValues={
                  lease.revisionDay !== null
                    ? {
                        revisionDay: lease.revisionDay,
                        revisionMonth: lease.revisionMonth!,
                        referenceQuarter: lease.referenceQuarter!,
                        referenceYear: lease.referenceYear!,
                        baseIndexValue: lease.baseIndexValue,
                      }
                    : undefined
                }
                onSubmit={handleRevisionParametersSave}
                onCancel={() => setIsEditingRevisionParameters(false)}
                isPending={configureRevisionParameters.isPending}
              />
            ) : lease.revisionDay !== null ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de révision annuelle
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {lease.revisionDay}{" "}
                    {MONTH_LABELS[(lease.revisionMonth ?? 1) - 1]}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Trimestre de référence
                  </p>
                  <p>
                    {REFERENCE_QUARTER_LABELS[
                      lease.referenceQuarter ?? "Q1"
                    ] ?? lease.referenceQuarter}{" "}
                    {lease.referenceYear}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Indice de base
                  </p>
                  <p>
                    {lease.baseIndexValue !== null &&
                    lease.baseIndexValue !== undefined
                      ? lease.baseIndexValue
                      : "Non renseigné"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Indice de révision
                  </p>
                  <p>
                    {REVISION_INDEX_TYPE_LABELS[lease.revisionIndexType] ??
                      lease.revisionIndexType}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-sm text-muted-foreground">
                  Configurer les paramètres de révision
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingRevisionParameters(true)}
                >
                  <ClipboardEdit
                    className="mr-1 h-3 w-3"
                    aria-hidden="true"
                  />
                  Configurer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Lignes de facturation</CardTitle>
            {!isEditingBillingLines && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingBillingLines(true)}
                className="w-full sm:w-auto"
              >
                <Settings className="mr-1 h-3 w-3" aria-hidden="true" />
                Configurer les lignes
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingBillingLines ? (
              <BillingLinesForm
                initialLines={billingLines}
                rentAmountCents={rentCents}
                unitBillableOptions={unit?.billableOptions}
                onSubmit={handleBillingLinesSave}
                onCancel={() => setIsEditingBillingLines(false)}
                isPending={configureBillingLines.isPending}
              />
            ) : (
              <div className="space-y-3">
                {/* Mobile: stacked cards */}
                <div className="space-y-3 sm:hidden">
                  <div className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <p className="font-medium">Loyer</p>
                      <Badge variant={TYPE_BADGE_VARIANT.rent} className="mt-1">
                        {BILLING_LINE_TYPE_LABELS.rent}
                      </Badge>
                    </div>
                    <p className="text-right font-medium">{formatCurrency(rentCents)}</p>
                  </div>
                  {billingLines.map((line, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-md border border-border p-3">
                      <div>
                        <p className="font-medium">{line.label}</p>
                        <Badge variant={TYPE_BADGE_VARIANT[line.type] ?? "outline"} className="mt-1">
                          {BILLING_LINE_TYPE_LABELS[line.type] ?? line.type}
                        </Badge>
                      </div>
                      <p className="text-right font-medium">{formatCurrency(line.amountCents)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-3 font-medium">
                    <p>Total mensuel</p>
                    <p>{formatCurrency(totalCents)}</p>
                  </div>
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Libellé</th>
                        <th className="pb-2 font-medium">Type</th>
                        <th className="pb-2 text-right font-medium">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Loyer</td>
                        <td className="py-2">
                          <Badge variant={TYPE_BADGE_VARIANT.rent}>
                            {BILLING_LINE_TYPE_LABELS.rent}
                          </Badge>
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(rentCents)}
                        </td>
                      </tr>
                      {billingLines.map((line, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{line.label}</td>
                          <td className="py-2">
                            <Badge variant={TYPE_BADGE_VARIANT[line.type] ?? "outline"}>
                              {BILLING_LINE_TYPE_LABELS[line.type] ?? line.type}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">
                            {formatCurrency(line.amountCents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-medium">
                        <td className="pt-2" colSpan={2}>
                          Total mensuel
                        </td>
                        <td className="pt-2 text-right">
                          {formatCurrency(totalCents)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {billingLines.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Ajouter des provisions et options
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
