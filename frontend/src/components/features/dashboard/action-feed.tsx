"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  CircleDollarSign,
  Clock,
  ClipboardList,
  FileText,
  Landmark,
  Mail,
  Plus,
  ArrowRight,
  Receipt,
  Upload,
  Users,
  ShieldAlert,
  ShieldX,
  FileCheck,
  Wifi,
  WifiOff,
} from "lucide-react";

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
import { useLeases } from "@/hooks/use-leases";
import { useRentCalls } from "@/hooks/use-rent-calls";
import { useBankStatements } from "@/hooks/use-bank-statements";
import { useUnpaidRentCalls } from "@/hooks/use-unpaid-rent-calls";
import { useEscalationStatuses } from "@/hooks/use-escalation";
import { useChargeRegularizations } from "@/hooks/use-charge-regularization";
import { useRevisions } from "@/hooks/use-revisions";
import { useAlertPreferences } from "@/hooks/use-alert-preferences";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { useMemo } from "react";

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  Bell,
  BookOpen,
  CircleDollarSign,
  Clock,
  Plus,
  Building2,
  ClipboardList,
  FileText,
  Landmark,
  Mail,
  Receipt,
  Upload,
  Users,
  ShieldAlert,
  ShieldX,
  FileCheck,
  Wifi,
  WifiOff,
};

export interface ActionItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  href?: string;
  priority: "critical" | "high" | "medium" | "low";
  timestamp?: string;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  // Use calendar day difference to avoid hour-of-day rounding issues
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) {
    const futureDays = Math.abs(diffDays);
    if (futureDays === 1) return "Demain";
    if (futureDays < 7) return `Dans ${futureDays} jours`;
    return `Le ${date.toLocaleDateString("fr-FR")}`;
  }
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return `Le ${date.toLocaleDateString("fr-FR")}`;
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
  const { data: leases } = useLeases(entityId ?? "");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: rentCallsForCurrentMonth } = useRentCalls(
    entityId ?? "",
    currentMonth,
  );

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

  if (
    entityId &&
    tenants &&
    tenants.length > 0 &&
    units &&
    units.length > 0 &&
    (!leases || leases.length === 0)
  ) {
    actions.push({
      id: "onboarding-create-lease",
      icon: "FileText",
      title: "Créez vos baux",
      description:
        "Associez un locataire à un lot en créant un bail pour démarrer la gestion locative",
      href: "/leases/new",
      priority: "medium",
    });
  }

  const hasActiveLeases =
    leases &&
    leases.length > 0 &&
    leases.some((l) => !l.endDate || new Date(l.endDate) > now);

  if (
    entityId &&
    hasActiveLeases &&
    (!rentCallsForCurrentMonth || rentCallsForCurrentMonth.length === 0)
  ) {
    actions.push({
      id: "onboarding-generate-rent-calls",
      icon: "Receipt",
      title: "Générez vos appels de loyer",
      description:
        "Créez les appels de loyer pour tous vos baux actifs",
      href: "/rent-calls",
      priority: "high",
    });
  }

  const hasUnsentRentCalls =
    rentCallsForCurrentMonth &&
    rentCallsForCurrentMonth.length > 0 &&
    rentCallsForCurrentMonth.some((rc) => !rc.sentAt);

  if (entityId && hasUnsentRentCalls) {
    actions.push({
      id: "onboarding-send-rent-calls",
      icon: "Mail",
      title: "Envoyez les appels de loyer par email",
      description:
        "Envoyez les appels de loyer générés à vos locataires par email avec le PDF en pièce jointe",
      href: "/rent-calls",
      priority: "high",
    });
  }

  const { data: bankStatements } = useBankStatements(entityId ?? "");

  const hasSentRentCalls =
    rentCallsForCurrentMonth &&
    rentCallsForCurrentMonth.length > 0 &&
    rentCallsForCurrentMonth.every((rc) => rc.sentAt);

  if (
    entityId &&
    hasSentRentCalls &&
    (!bankStatements || bankStatements.length === 0)
  ) {
    actions.push({
      id: "onboarding-import-bank-statement",
      icon: "Upload",
      title: "Importez votre relevé bancaire",
      description:
        "Importez un relevé CSV ou Excel pour préparer le rapprochement bancaire",
      href: "/payments",
      priority: "high",
    });
  }

  const hasPaidRentCalls =
    rentCallsForCurrentMonth &&
    rentCallsForCurrentMonth.length > 0 &&
    rentCallsForCurrentMonth.some(
      (rc) => rc.paymentStatus === "paid" || rc.paymentStatus === "overpaid",
    );

  // AC 9: "Envoyez les quittances" — batch email not yet implemented,
  // prompt points to /rent-calls for manual download until email story lands.
  if (entityId && hasPaidRentCalls) {
    actions.push({
      id: "onboarding-download-receipts",
      icon: "FileCheck",
      title: "Envoyez les quittances de loyer",
      description:
        "Des paiements ont été enregistrés — téléchargez les quittances pour vos locataires depuis la page des appels de loyer",
      href: "/rent-calls",
      priority: "medium",
    });
  }

  const hasRentCalls =
    rentCallsForCurrentMonth && rentCallsForCurrentMonth.length > 0;

  if (entityId && hasRentCalls) {
    actions.push({
      id: "onboarding-view-account-book",
      icon: "BookOpen",
      title: "Consultez votre livre de comptes",
      description:
        "Retrouvez l\u2019ensemble de vos écritures comptables : appels de loyer, paiements et régularisations",
      href: "/accounting",
      priority: "low",
    });
  }

  return actions;
}

function useInsuranceAlerts(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: tenants } = useTenants(entityId ?? "");
  const actions: ActionItem[] = [];

  if (!tenants) return actions;

  const now = new Date();

  for (const tenant of tenants) {
    if (!tenant.renewalDate) continue;

    const renewal = new Date(tenant.renewalDate);
    const diffMs = renewal.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const fullName = `${tenant.firstName} ${tenant.lastName}`;

    if (diffDays < 0) {
      actions.push({
        id: `insurance-expired-${tenant.id}`,
        icon: "ShieldX",
        title: `Assurance de ${fullName} expirée depuis le ${renewal.toLocaleDateString("fr-FR")}`,
        description: `Contactez le locataire pour obtenir une attestation d\u2019assurance à jour.`,
        href: `/tenants/${tenant.id}`,
        priority: "high",
        timestamp: tenant.renewalDate!,
      });
    } else if (diffDays <= 30) {
      actions.push({
        id: `insurance-expiring-${tenant.id}`,
        icon: "ShieldAlert",
        title: `Assurance de ${fullName} expire le ${renewal.toLocaleDateString("fr-FR")}`,
        description: `L\u2019assurance expire dans ${diffDays} jour${diffDays > 1 ? "s" : ""}. Pensez à demander le renouvellement.`,
        href: `/tenants/${tenant.id}`,
        priority: "medium",
        timestamp: tenant.renewalDate!,
      });
    }
  }

  return actions;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatEscalationStatus(
  escalation: { tier1SentAt: string | null; tier2SentAt: string | null; tier3SentAt: string | null } | undefined,
): string {
  if (!escalation) return "";
  if (escalation.tier3SentAt) {
    return ` — Signalements générés le ${new Date(escalation.tier3SentAt).toLocaleDateString("fr-FR")}`;
  }
  if (escalation.tier2SentAt) {
    return ` — Mise en demeure générée le ${new Date(escalation.tier2SentAt).toLocaleDateString("fr-FR")}`;
  }
  if (escalation.tier1SentAt) {
    return ` — Relance envoyée le ${new Date(escalation.tier1SentAt).toLocaleDateString("fr-FR")}`;
  }
  return "";
}

function useUnpaidAlerts(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: unpaidRentCalls } = useUnpaidRentCalls(entityId ?? undefined);

  const rentCallIds = useMemo(
    () => (unpaidRentCalls ?? []).map((rc) => rc.id),
    [unpaidRentCalls],
  );

  const { data: escalationStatuses } = useEscalationStatuses(
    entityId ?? undefined,
    rentCallIds,
  );

  const escalationMap = useMemo(() => {
    const map = new Map<string, { tier1SentAt: string | null; tier2SentAt: string | null; tier3SentAt: string | null }>();
    if (escalationStatuses) {
      for (const es of escalationStatuses) {
        map.set(es.rentCallId, es);
      }
    }
    return map;
  }, [escalationStatuses]);

  const actions: ActionItem[] = [];

  if (!unpaidRentCalls) return actions;

  for (const rc of unpaidRentCalls) {
    const tenantName =
      rc.tenantType === "company" && rc.tenantCompanyName
        ? rc.tenantCompanyName
        : `${rc.tenantFirstName} ${rc.tenantLastName}`;
    const amount = formatAmount(rc.remainingBalanceCents ?? rc.totalAmountCents);
    const escalation = escalationMap.get(rc.id);
    const escalationSuffix = formatEscalationStatus(escalation);

    actions.push({
      id: `unpaid-${rc.id}`,
      icon: "AlertTriangle",
      title: `Loyer impayé — ${tenantName} — ${amount} — ${rc.daysLate} jour${rc.daysLate > 1 ? "s" : ""} de retard`,
      description: `Lot ${rc.unitIdentifier} — Période ${rc.month}${escalationSuffix}`,
      href: `/rent-calls/${rc.id}`,
      priority: "critical",
      timestamp: `${rc.month}-01`,
    });
  }

  return actions;
}

function useUnsettledRegularizationAlerts(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: regularizations } = useChargeRegularizations(entityId ?? undefined);
  const actions: ActionItem[] = [];

  if (!regularizations) return actions;

  const unsettled = regularizations.filter(
    (r) => r.appliedAt !== null && r.settledAt === null,
  );

  if (unsettled.length === 0) return actions;

  const fiscalYears = unsettled
    .map((r) => r.fiscalYear)
    .sort((a, b) => b - a)
    .join(", ");

  const earliestAppliedAt = unsettled
    .map((r) => r.appliedAt!)
    .sort()[0];

  actions.push({
    id: "unsettled-regularizations",
    icon: "CircleDollarSign",
    title: `${unsettled.length} régularisation${unsettled.length > 1 ? "s" : ""} en attente de règlement`,
    description: `Exercice${unsettled.length > 1 ? "s" : ""} : ${fiscalYears} — Marquez les régularisations comme réglées une fois les paiements reçus.`,
    href: "/charges",
    priority: "high",
    timestamp: earliestAppliedAt,
  });

  return actions;
}

function useRevisionAlerts(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: revisions } = useRevisions(entityId ?? undefined);
  const actions: ActionItem[] = [];

  if (!revisions) return actions;

  const pending = revisions.filter((r) => r.status === "pending");
  if (pending.length === 0) return actions;

  const names = pending.map((r) => r.tenantName).join(", ");
  actions.push({
    id: "revisions-pending-approval",
    icon: "Clock",
    title: `${pending.length} révision${pending.length > 1 ? "s" : ""} en attente d'approbation`,
    description: `Locataires : ${names}`,
    href: "/revisions",
    priority: "high",
    timestamp: pending[0].calculatedAt,
  });

  return actions;
}

function useBankConnectionAlerts(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: connections } = useBankConnections(entityId ?? "");
  const actions: ActionItem[] = [];

  if (!connections) return actions;

  for (const connection of connections) {
    if (connection.status === "expired" || connection.status === "suspended") {
      actions.push({
        id: `bank-connection-expired-${connection.id}`,
        icon: "WifiOff",
        title: `Connexion bancaire expirée — ${connection.institutionName}`,
        description:
          "Le consentement bancaire a expiré. Reconnectez-vous pour reprendre la synchronisation automatique des transactions.",
        href: entityId
          ? `/entities/${entityId}/bank-accounts`
          : undefined,
        priority: "high",
      });
    }
  }

  return actions;
}

function useAlertPreferencesInfo(): ActionItem[] {
  const { entityId } = useCurrentEntity();
  const { data: preferences } = useAlertPreferences(entityId ?? "");
  const actions: ActionItem[] = [];

  if (!entityId || !preferences) return actions;

  const enabledCount = preferences.filter((p) => p.enabled).length;

  if (enabledCount > 0) {
    actions.push({
      id: "alert-preferences-active",
      icon: "Bell",
      title: `Alertes email actives (${enabledCount} type${enabledCount > 1 ? "s" : ""})`,
      description:
        "Vous recevez des alertes par email pour cette entité. Gérez vos préférences dans les paramètres.",
      href: `/entities/${entityId}/edit`,
      priority: "low",
    });
  }

  return actions;
}

const priorityLabels: Record<ActionItem["priority"], string> = {
  critical: "Urgent",
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
              {action.timestamp && (
                <time
                  dateTime={action.timestamp}
                  className="mt-1 block text-xs text-muted-foreground"
                >
                  {formatRelativeDate(action.timestamp)}
                </time>
              )}
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
  const insuranceAlerts = useInsuranceAlerts();
  const unpaidAlerts = useUnpaidAlerts();
  const unsettledAlerts = useUnsettledRegularizationAlerts();
  const revisionAlerts = useRevisionAlerts();
  const bankConnectionAlerts = useBankConnectionAlerts();
  const alertPreferencesInfo = useAlertPreferencesInfo();
  const displayActions = actions ?? [...unpaidAlerts, ...unsettledAlerts, ...revisionAlerts, ...bankConnectionAlerts, ...insuranceAlerts, ...onboardingActions, ...alertPreferencesInfo];
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
