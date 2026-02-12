"use client";

import Link from "next/link";
import { Users, Plus, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useTenants } from "@/hooks/use-tenants";
import { TENANT_TYPE_LABELS } from "@/lib/constants/tenant-types";
import type { TenantData } from "@/lib/api/tenants-api";

function TenantCard({ tenant }: { tenant: TenantData }) {
  return (
    <Link href={`/tenants/${tenant.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-start justify-between p-4">
          <div className="space-y-1">
            <p className="font-medium">
              {tenant.firstName} {tenant.lastName}
            </p>
            {tenant.companyName && (
              <p className="text-sm text-muted-foreground">
                {tenant.companyName}
              </p>
            )}
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {tenant.email}
            </p>
          </div>
          <Badge variant="secondary">
            {TENANT_TYPE_LABELS[tenant.type] ?? tenant.type}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function TenantsPage() {
  const { entityId } = useCurrentEntity();
  const { data: tenants, isLoading, isError } = useTenants(entityId ?? "");

  if (!entityId) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Locataires</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucune entité sélectionnée
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sélectionnez ou créez une entité pour voir vos locataires
          </p>
          <Button asChild className="mt-4">
            <Link href="/entities">Gérer mes entités</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Locataires</h1>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouveau locataire
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des locataires
          </p>
        </div>
      )}

      {!isLoading && !isError && (!tenants || tenants.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Aucun locataire
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enregistrez votre premier locataire pour commencer
          </p>
          <Button asChild className="mt-4">
            <Link href="/tenants/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un locataire
            </Link>
          </Button>
        </div>
      )}

      {tenants && tenants.length > 0 && (
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
        </div>
      )}
    </div>
  );
}
