"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";

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
import { TenantForm } from "@/components/features/tenants/tenant-form";
import { TENANT_TYPE_LABELS } from "@/lib/constants/tenant-types";

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: tenant, isLoading, isError } = useTenant(id);
  const [isEditing, setIsEditing] = useState(false);

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
      </div>
    </div>
  );
}
