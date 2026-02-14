"use client";

import { Check, Circle, Loader2 } from "lucide-react";

export type StepStatus = "pending" | "active" | "completed";

export interface FlowStep {
  label: string;
  status: StepStatus;
  description?: string;
}

interface ContinuousFlowStepperProps {
  steps: FlowStep[];
}

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      );
    case "active":
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
          <Loader2
            className="h-3.5 w-3.5 animate-spin text-primary"
            aria-hidden="true"
          />
        </div>
      );
    case "pending":
    default:
      return (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-muted-foreground/30">
          <Circle
            className="h-3 w-3 text-muted-foreground/30"
            aria-hidden="true"
          />
        </div>
      );
  }
}

export function ContinuousFlowStepper({ steps }: ContinuousFlowStepperProps) {
  return (
    <div className="rounded-lg border bg-card p-4" role="list" aria-label="Étapes du cycle mensuel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              role="listitem"
              aria-current={step.status === "active" ? "step" : undefined}
              className="flex items-center gap-2"
            >
              <StepIcon status={step.status} />
              <div className="flex flex-col">
                <span
                  className={`text-sm font-medium ${
                    step.status === "active"
                      ? "text-primary"
                      : step.status === "completed"
                        ? "text-green-700 dark:text-green-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`hidden sm:block mx-2 h-0.5 w-8 ${
                  step.status === "completed"
                    ? "bg-green-500"
                    : "bg-muted-foreground/20"
                }`}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
