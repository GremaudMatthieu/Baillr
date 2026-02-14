import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import {
  ContinuousFlowStepper,
  type FlowStep,
} from "../continuous-flow-stepper";

describe("ContinuousFlowStepper", () => {
  const defaultSteps: FlowStep[] = [
    { label: "Import", status: "completed", description: "Fichier chargé" },
    {
      label: "Rapprochement",
      status: "completed",
      description: "3 rapprochés, 1 non rapproché",
    },
    { label: "Validation", status: "active", description: "1/4 traités" },
    { label: "Terminé", status: "pending" },
  ];

  it("should render all 4 step labels", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Rapprochement")).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();
    expect(screen.getByText("Terminé")).toBeInTheDocument();
  });

  it("should render step descriptions", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    expect(screen.getByText("Fichier chargé")).toBeInTheDocument();
    expect(
      screen.getByText("3 rapprochés, 1 non rapproché"),
    ).toBeInTheDocument();
    expect(screen.getByText("1/4 traités")).toBeInTheDocument();
  });

  it("should set aria-current on active step", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    const items = screen.getAllByRole("listitem");
    const activeItem = items.find(
      (item) => item.getAttribute("aria-current") === "step",
    );
    expect(activeItem).toBeDefined();
    expect(activeItem?.textContent).toContain("Validation");
  });

  it("should have role=list for ARIA", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    expect(
      screen.getByRole("list", { name: "Étapes du cycle mensuel" }),
    ).toBeInTheDocument();
  });

  it("should render completed steps with green styling", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    const importLabel = screen.getByText("Import");
    expect(importLabel.className).toContain("text-green-700");
  });

  it("should render active step with primary styling", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    const validationLabel = screen.getByText("Validation");
    expect(validationLabel.className).toContain("text-primary");
  });

  it("should render pending step with muted styling", () => {
    renderWithProviders(<ContinuousFlowStepper steps={defaultSteps} />);

    const terminéLabel = screen.getByText("Terminé");
    expect(terminéLabel.className).toContain("text-muted-foreground");
  });

  it("should render all completed when all steps done", () => {
    const allDone: FlowStep[] = [
      { label: "Import", status: "completed" },
      { label: "Rapprochement", status: "completed" },
      { label: "Validation", status: "completed" },
      { label: "Terminé", status: "completed", description: "Cycle terminé" },
    ];

    renderWithProviders(<ContinuousFlowStepper steps={allDone} />);

    expect(screen.getByText("Cycle terminé")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    const activeItem = items.find(
      (item) => item.getAttribute("aria-current") === "step",
    );
    expect(activeItem).toBeUndefined();
  });
});
