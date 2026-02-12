"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, ClipboardList, Landmark, Plus, ArrowRight, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentEntity } from "@/hooks/use-current-entity";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useProperties } from "@/hooks/use-properties";
import { useUnits } from "@/hooks/use-units";
import { useTenants } from "@/hooks/use-tenants";

const iconMap: Record<string, LucideIcon> = {
  Plus,
  Building2,
  ClipboardList,
  Landmark,
  Users,
};

export interface ActionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  href?: string;
  priority: "high" | "medium" | "low";
}

function useOnboardingActions(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: bankAccounts } = useBankAccounts(entityId ?? "");
  const { data: properties } = useProperties(entityId ?? "");

  const actions: ActionItem[] = [];

  if (!entityId) {
    actions.push({
      id: "onboarding-create-entity",
      icon: "Plus",
      title: "Créez votre première entité propriétaire",
      description:
        "Commencez par configurer votre SCI ou votre nom propre pour gérer vos biens",
      href: "/entities/new",
      priority: "high",
    });
  }

  if (entityId && (!bankAccounts || bankAccounts.length === 0)) {
    actions.push({
      id: "onboarding-add-bank-account",
      icon: "Landmark",
      title: "Ajoutez un compte bancaire",
      description:
        "Configurez les coordonnées bancaires de votre entité pour les appels de loyer",
      href: `/entities/${entityId}/bank-accounts`,
      priority: "medium",
    });
  }

  if (entityId && (!properties || properties.length === 0)) {
    actions.push({
      id: "onboarding-add-property",
      icon: "Building2",
      title: "Ajoutez un bien immobilier",
      description:
        "Rattachez un bien à votre entité pour commencer la gestion locative",
      href: entityId ? "/properties/new" : "/entities",
      priority: "medium",
    });
  }

  const firstPropertyId = properties?.[0]?.id;
  const { data: units } = useUnits(firstPropertyId ?? "");
  const { data: tenants } = useTenants(entityId ?? "");

  if (
    entityId &&
    properties &&
    properties.length > 0 &&
    firstPropertyId &&
    (!units || units.length === 0)
  ) {
    actions.push({
      id: "onboarding-add-unit",
      icon: "ClipboardList",
      title: "Créez les lots de ce bien",
      description:
        "Ajoutez les lots (appartements, parkings, commerces) pour votre bien",
      href: `/properties/${firstPropertyId}/units/new`,
      priority: "medium",
    });
  }

  if (
    entityId &&
    properties &&
    properties.length > 0 &&
    units &&
    units.length > 0 &&
    (!tenants || tenants.length === 0)
  ) {
    actions.push({
      id: "onboarding-register-tenant",
      icon: "Users",
      title: "Enregistrez vos locataires",
      description:
        "Ajoutez vos locataires pour pouvoir créer des baux et gérer vos locations",
      href: "/tenants/new",
      priority: "medium",
    });
  }

  return actions;
}

const priorityLabels: Record<ActionItem["priority"], string> = {
  high: "Recommandé",
  medium: "Suggéré",
  low: "Optionnel",
};

function ActionCard({ action }: { action: ActionItem }) {
  const Icon = iconMap[action.icon];

  return (
    <article>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              {Icon && (
                <Icon
                  className="h-5 w-5 text-accent-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <CardTitle className="text-sm">{action.title}</CardTitle>
                <span className="inline-flex shrink-0 items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {priorityLabels[action.priority]}
                </span>
              </div>
              <CardDescription>{action.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        {action.href && (
          <CardContent>
            <Button asChild>
              <Link href={action.href}>
                Commencer
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ClipboardList
        className="h-10 w-10 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm font-medium text-muted-foreground">
        Aucune action en attente
      </p>
    </div>
  );
}

interface ActionFeedProps {
  actions?: ActionItem[];
}

export function ActionFeed({ actions }: ActionFeedProps) {
  const onboardingActions = useOnboardingActions();
  const displayActions = actions ?? onboardingActions;
  const hasActions = displayActions.length > 0;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">Actions en attente</h2>
      <ul aria-label="Actions en attente" className="list-none space-y-4">
        {hasActions ? (
          displayActions.map((action) => (
            <li key={action.id}>
              <ActionCard action={action} />
            </li>
          ))
        ) : (
          <li>
            <EmptyState />
          </li>
        )}
      </ul>
    </section>
  );
}
