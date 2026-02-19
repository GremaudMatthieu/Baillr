"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  linked: { label: "Connectée", variant: "default" },
  expired: { label: "Expirée", variant: "destructive" },
  suspended: { label: "Suspendue", variant: "destructive" },
  disconnected: { label: "Déconnectée", variant: "secondary" },
};

interface BankConnectionBadgeProps {
  status: string;
}

export function BankConnectionBadge({ status }: BankConnectionBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
