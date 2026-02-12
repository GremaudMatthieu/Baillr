"use client";

import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export function InsuranceStatusBadge({
  renewalDate,
}: {
  renewalDate: string;
}) {
  const renewal = new Date(renewalDate);
  const now = new Date();
  const diffMs = renewal.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = renewal.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (diffDays < 0) {
    return (
      <p className="flex items-center gap-1.5 text-destructive">
        <ShieldX className="h-4 w-4" aria-hidden="true" />
        <span>{formatted} (expirée)</span>
      </p>
    );
  }

  if (diffDays <= 30) {
    return (
      <p className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
        <ShieldAlert className="h-4 w-4" aria-hidden="true" />
        <span>
          {formatted} (expire dans {diffDays} jour{diffDays > 1 ? "s" : ""})
        </span>
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5">
      <ShieldCheck
        className="h-4 w-4 text-green-600 dark:text-green-400"
        aria-hidden="true"
      />
      <span>{formatted}</span>
    </p>
  );
}
