"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Euro, FileText, MapPin, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/use-tenants";
import { useLeases } from "@/hooks/use-leases";
import { useTenantAccount } from "@/hooks/use-tenant-account";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { TenantForm } from "@/components/features/tenants/tenant-form";
import { TenantCurrentAccount } from "@/components/features/tenants/tenant-current-account";
import { TENANT_TYPE_LABELS } from "@/lib/constants/tenant-types";
import { REVISION_INDEX_TYPE_LABELS } from "@/lib/constants/revision-index-types";
import { InsuranceStatusBadge } from "@/components/features/tenants/insurance-status-badge";

function formatRent(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { entityId } = useCurrentEntity();
  const { data: tenant, isLoading, isError } = useTenant(id);
  const { data: leases } = useLeases(entityId ?? "");
  const {
    data: accountData,
    isLoading: isLoadingAccount,
    isError: isErrorAccount,
  } = useTenantAccount(entityId ?? "", id);
  const [isEditing, setIsEditing] = useState(false);

  const tenantLeases = leases?.filter((l) => l.tenantId === id) ?? [];

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="max-w-2xl">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Skeleton className="mb-1 h-4 w-16" />
                <Skeleton className="h-5 w-48" />
              </div>
              <div>
                <Skeleton className="mb-1 h-4 w-20" />
                <Skeleton className="h-5 w-64" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-destructive">Locataire introuvable</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
            aria-label="Annuler la modification"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Modifier le locataire
          </h1>
        </div>
        <div className="max-w-2xl">
          <TenantForm
            tenant={tenant}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
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
          {tenant.firstName} {tenant.lastName}
        </h1>
        <Badge variant="secondary">
          {TENANT_TYPE_LABELS[tenant.type] ?? tenant.type}
        </Badge>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Détails du locataire
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Modifier
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nom complet
              </p>
              <p>
                {tenant.firstName} {tenant.lastName}
              </p>
            </div>

            {tenant.companyName && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Entreprise
                </p>
                <p>{tenant.companyName}</p>
              </div>
            )}

            {tenant.siret && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  SIRET
                </p>
                <p>{tenant.siret}</p>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email
              </p>
              <p>{tenant.email}</p>
            </div>

            {tenant.phoneNumber && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Téléphone
                </p>
                <p>{tenant.phoneNumber}</p>
              </div>
            )}

            {tenant.addressStreet && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Adresse
                </p>
                <p className="flex items-start gap-1">
                  <MapPin
                    className="mt-0.5 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>
                    {tenant.addressStreet}
                    {tenant.addressComplement && (
                      <>
                        <br />
                        {tenant.addressComplement}
                      </>
                    )}
                    <br />
                    {tenant.addressPostalCode} {tenant.addressCity}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assurance habitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(tenant.insuranceProvider || tenant.policyNumber || tenant.renewalDate) ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Assureur
                  </p>
                  <p>{tenant.insuranceProvider}</p>
                </div>

                {tenant.policyNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Numéro de police
                    </p>
                    <p>{tenant.policyNumber}</p>
                  </div>
                )}

                {tenant.renewalDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date de renouvellement
                    </p>
                    <InsuranceStatusBadge renewalDate={tenant.renewalDate} />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune assurance renseignée
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Baux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tenantLeases.length > 0 ? (
              tenantLeases.map((lease) => (
                <Link
                  key={lease.id}
                  href={`/leases/${lease.id}`}
                  className="block rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        Début : {formatDate(lease.startDate)}
                      </p>
                      <p className="flex items-center gap-1 text-sm">
                        <Euro className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                        {formatRent(lease.rentAmountCents)} / mois
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {REVISION_INDEX_TYPE_LABELS[lease.revisionIndexType] ??
                        lease.revisionIndexType}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Aucun bail pour ce locataire
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compte courant</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAccount && (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            )}
            {isErrorAccount && (
              <p className="text-sm text-destructive">
                Erreur lors du chargement du compte courant
              </p>
            )}
            {!isLoadingAccount && !isErrorAccount && accountData && (
              <TenantCurrentAccount
                entries={accountData.entries}
                balanceCents={accountData.balanceCents}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
