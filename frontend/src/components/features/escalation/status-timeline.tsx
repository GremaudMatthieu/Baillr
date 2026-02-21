"use client";

import {
  Mail,
  FileText,
  Users,
  CheckCircle2,
  Circle,
  Loader2,
  Download,
  Shield,
  Scale,
  UserCheck,
  Send,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EscalationStatusData } from "@/lib/api/escalation-api";

interface StatusTimelineProps {
  escalation: EscalationStatusData | null;
  onSendReminder: () => void;
  isSendingReminder: boolean;
  onDownloadFormalNotice: () => void;
  isDownloadingFormalNotice: boolean;
  onDownloadStakeholderLetter: (
    type: "insurance" | "lawyer" | "guarantor",
  ) => void;
  isDownloadingStakeholder: boolean;
  downloadingStakeholderType: string | null;
  isRegisteredMailAvailable?: boolean;
  onSendRegisteredMail?: () => void;
  isSendingRegisteredMail?: boolean;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type TierStatus = "available" | "completed" | "locked";

function getTierStatuses(escalation: EscalationStatusData | null): {
  tier1: TierStatus;
  tier2: TierStatus;
  tier3: TierStatus;
} {
  if (!escalation) {
    return { tier1: "available", tier2: "available", tier3: "available" };
  }
  return {
    tier1: escalation.tier1SentAt ? "completed" : "available",
    tier2: escalation.tier2SentAt ? "completed" : "available",
    tier3: escalation.tier3SentAt ? "completed" : "available",
  };
}

function StatusIcon({ status }: { status: TierStatus }) {
  if (status === "completed") {
    return (
      <CheckCircle2
        className="h-5 w-5 text-green-600 dark:text-green-400"
        aria-hidden="true"
      />
    );
  }
  if (status === "locked") {
    return (
      <Circle
        className="h-5 w-5 text-muted-foreground"
        aria-hidden="true"
      />
    );
  }
  return (
    <Circle
      className="h-5 w-5 text-blue-600 dark:text-blue-400"
      aria-hidden="true"
    />
  );
}

function statusLabel(status: TierStatus): string {
  if (status === "completed") return "Effectué";
  if (status === "locked") return "Verrouillé";
  return "Disponible";
}

function registeredMailStatusLabel(status: string | null): string {
  switch (status) {
    case "waiting":
      return "En attente";
    case "sent":
      return "Envoyé";
    case "AR":
      return "Accusé de réception";
    case "negligence":
      return "Négligence (15 jours)";
    case "refused":
      return "Refusé";
    case "bounced":
      return "Non délivré";
    case "error":
      return "Erreur technique";
    default:
      return status ?? "";
  }
}

function registeredMailStatusVariant(
  status: string | null,
): "default" | "destructive" | "outline" | "secondary" {
  switch (status) {
    case "AR":
      return "default";
    case "refused":
    case "bounced":
    case "error":
      return "destructive";
    case "sent":
    case "waiting":
      return "secondary";
    default:
      return "outline";
  }
}

export function StatusTimeline({
  escalation,
  onSendReminder,
  isSendingReminder,
  onDownloadFormalNotice,
  isDownloadingFormalNotice,
  onDownloadStakeholderLetter,
  isDownloadingStakeholder,
  downloadingStakeholderType,
  isRegisteredMailAvailable = false,
  onSendRegisteredMail,
  isSendingRegisteredMail = false,
}: StatusTimelineProps) {
  const { tier1, tier2, tier3 } = getTierStatuses(escalation);
  const hasRegisteredMail = !!escalation?.registeredMailTrackingId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Procédure de recouvrement</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 border-l-2 border-muted pl-6">
          {/* Tier 1 — Email reminder */}
          <li className="relative">
            <span className="absolute -left-[calc(1.5rem+1px)] flex h-6 w-6 items-center justify-center rounded-full bg-background">
              <StatusIcon status={tier1} />
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium text-sm">
                  Tier 1 — Relance par email
                </span>
                <Badge
                  variant={tier1 === "completed" ? "default" : "outline"}
                  className="text-xs"
                >
                  {statusLabel(tier1)}
                </Badge>
              </div>
              {tier1 === "completed" && escalation?.tier1SentAt && (
                <p className="text-xs text-muted-foreground">
                  Envoyé le {formatDate(escalation.tier1SentAt)}
                  {escalation.tier1RecipientEmail &&
                    ` à ${escalation.tier1RecipientEmail}`}
                </p>
              )}
              {tier1 === "available" && (
                <Button
                  size="sm"
                  onClick={onSendReminder}
                  disabled={isSendingReminder}
                >
                  {isSendingReminder ? (
                    <Loader2
                      className="mr-1 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Mail className="mr-1 h-4 w-4" aria-hidden="true" />
                  )}
                  Envoyer la relance
                </Button>
              )}
            </div>
          </li>

          {/* Tier 2 — Formal notice */}
          <li className="relative">
            <span className="absolute -left-[calc(1.5rem+1px)] flex h-6 w-6 items-center justify-center rounded-full bg-background">
              <StatusIcon status={tier2} />
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium text-sm">
                  Tier 2 — Mise en demeure
                </span>
                <Badge
                  variant={tier2 === "completed" ? "default" : "outline"}
                  className="text-xs"
                >
                  {statusLabel(tier2)}
                </Badge>
              </div>
              {tier2 === "completed" && escalation?.tier2SentAt && (
                <p className="text-xs text-muted-foreground">
                  Généré le {formatDate(escalation.tier2SentAt)}
                </p>
              )}
              {tier2 !== "locked" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={tier2 === "completed" ? "outline" : "default"}
                    onClick={onDownloadFormalNotice}
                    disabled={isDownloadingFormalNotice}
                  >
                    {isDownloadingFormalNotice ? (
                      <Loader2
                        className="mr-1 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                    )}
                    {tier2 === "completed"
                      ? "Re-télécharger le PDF"
                      : "Générer la mise en demeure"}
                  </Button>
                  {tier2 === "completed" &&
                    isRegisteredMailAvailable &&
                    !hasRegisteredMail &&
                    onSendRegisteredMail && (
                      <Button
                        size="sm"
                        onClick={onSendRegisteredMail}
                        disabled={isSendingRegisteredMail}
                      >
                        {isSendingRegisteredMail ? (
                          <Loader2
                            className="mr-1 h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Send
                            className="mr-1 h-4 w-4"
                            aria-hidden="true"
                          />
                        )}
                        Envoyer en recommandé
                      </Button>
                    )}
                </div>
              )}
              {hasRegisteredMail && (
                <div className="rounded-md border p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Package
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium">
                      Lettre recommandée
                    </span>
                    <Badge variant={registeredMailStatusVariant(escalation?.registeredMailStatus ?? null)}>
                      {registeredMailStatusLabel(escalation?.registeredMailStatus ?? null)}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <dt>N° de suivi</dt>
                    <dd className="font-mono">
                      {escalation?.registeredMailTrackingId}
                    </dd>
                    {escalation?.registeredMailDispatchedAt && (
                      <>
                        <dt>Envoyé le</dt>
                        <dd>
                          {formatDate(escalation.registeredMailDispatchedAt)}
                        </dd>
                      </>
                    )}
                    {escalation?.registeredMailProofUrl?.startsWith("https://") && (
                      <>
                        <dt>Preuve</dt>
                        <dd>
                          <a
                            href={escalation.registeredMailProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline dark:text-blue-400"
                          >
                            Télécharger
                          </a>
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </li>

          {/* Tier 3 — Stakeholder notifications */}
          <li className="relative">
            <span className="absolute -left-[calc(1.5rem+1px)] flex h-6 w-6 items-center justify-center rounded-full bg-background">
              <StatusIcon status={tier3} />
            </span>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium text-sm">
                  Tier 3 — Signalements aux tiers
                </span>
                <Badge
                  variant={tier3 === "completed" ? "default" : "outline"}
                  className="text-xs"
                >
                  {statusLabel(tier3)}
                </Badge>
              </div>
              {tier3 === "completed" && escalation?.tier3SentAt && (
                <p className="text-xs text-muted-foreground">
                  Généré le {formatDate(escalation.tier3SentAt)}
                </p>
              )}
              {tier3 !== "locked" && (
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { type: "insurance" as const, icon: Shield, label: "Assureur" },
                      { type: "lawyer" as const, icon: Scale, label: "Avocat" },
                      { type: "guarantor" as const, icon: UserCheck, label: "Garant" },
                    ] as const
                  ).map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={tier3 === "completed" ? "outline" : "default"}
                      onClick={() => onDownloadStakeholderLetter(type)}
                      disabled={isDownloadingStakeholder}
                    >
                      {downloadingStakeholderType === type ? (
                        <Loader2
                          className="mr-1 h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Icon className="mr-1 h-4 w-4" aria-hidden="true" />
                      )}
                      {label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
