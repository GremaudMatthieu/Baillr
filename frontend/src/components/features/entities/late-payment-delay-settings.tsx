"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfigureLatePaymentDelay } from "@/hooks/use-configure-late-payment-delay";

interface LatePaymentDelaySettingsProps {
  entityId: string;
  currentDelay: number;
}

export function LatePaymentDelaySettings({
  entityId,
  currentDelay,
}: LatePaymentDelaySettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [days, setDays] = useState(String(currentDelay));
  const mutation = useConfigureLatePaymentDelay(entityId);

  const handleSave = () => {
    const parsed = parseInt(days, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 90) return;
    mutation.mutate(parsed, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancel = () => {
    setDays(String(currentDelay));
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Délai de retard de paiement :
        </span>
        <span className="text-sm font-medium">
          {currentDelay} jour{currentDelay > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          Modifier
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="late-payment-delay">Délai (jours)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="late-payment-delay"
            type="number"
            min={0}
            max={90}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">jours</span>
        </div>
      </div>
      <Button
        size="sm"
        onClick={handleSave}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "..." : "Enregistrer"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={mutation.isPending}
      >
        Annuler
      </Button>
    </div>
  );
}
