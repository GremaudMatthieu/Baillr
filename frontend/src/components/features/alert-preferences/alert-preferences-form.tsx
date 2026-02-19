"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useAlertPreferences,
  useUpdateAlertPreferences,
} from "@/hooks/use-alert-preferences";

const ALERT_TYPE_LABELS: Record<string, string> = {
  unpaid_rent: "Loyers impayés",
  insurance_expiring: "Assurances expirantes",
  escalation_threshold: "Relances impayés",
};

interface AlertPreferencesFormProps {
  entityId: string;
}

export function AlertPreferencesForm({ entityId }: AlertPreferencesFormProps) {
  const { data: preferences, isLoading } = useAlertPreferences(entityId);
  const updateMutation = useUpdateAlertPreferences(entityId);

  const handleToggle = (alertType: string, enabled: boolean) => {
    updateMutation.mutate({
      preferences: [{ alertType, enabled }],
    });
  };

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Chargement...</p>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-4">
      {preferences.map((pref) => {
        const label =
          ALERT_TYPE_LABELS[pref.alertType] ?? pref.alertType;
        return (
          <div
            key={pref.alertType}
            className="flex items-center justify-between gap-4"
          >
            <Label htmlFor={`alert-${pref.alertType}`} className="text-sm">
              {label}
            </Label>
            <Switch
              id={`alert-${pref.alertType}`}
              checked={pref.enabled}
              onCheckedChange={(checked: boolean) =>
                handleToggle(pref.alertType, checked)
              }
              aria-label={`${pref.enabled ? "Désactiver" : "Activer"} les alertes ${label.toLowerCase()}`}
            />
          </div>
        );
      })}
    </div>
  );
}
