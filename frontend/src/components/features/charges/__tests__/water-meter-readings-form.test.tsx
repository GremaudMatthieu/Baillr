import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { WaterMeterReadingsForm } from "../water-meter-readings-form";
import type { UnitData } from "@/lib/api/units-api";

const mockUnits: UnitData[] = [
  {
    id: "unit-a",
    propertyId: "prop-1",
    userId: "user-1",
    identifier: "Apt 1A",
    type: "apartment",
    floor: 1,
    surfaceArea: 45,
    billableOptions: [],
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
  {
    id: "unit-b",
    propertyId: "prop-1",
    userId: "user-1",
    identifier: "Apt 2B",
    type: "apartment",
    floor: 2,
    surfaceArea: 60,
    billableOptions: [],
    createdAt: "2025-01-01",
    updatedAt: "2025-01-01",
  },
];

describe("WaterMeterReadingsForm", () => {
  it("renders empty state when no units", () => {
    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        units={[]}
      />,
    );

    expect(
      screen.getByText(/Aucun lot trouvé/),
    ).toBeInTheDocument();
  });

  it("renders a row per unit with labels", () => {
    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        units={mockUnits}
      />,
    );

    expect(screen.getByText("Apt 1A")).toBeInTheDocument();
    expect(screen.getByText("Apt 2B")).toBeInTheDocument();
    expect(screen.getByText("Lot")).toBeInTheDocument();
    expect(screen.getByText("Ancien relevé")).toBeInTheDocument();
    expect(screen.getByText("Nouveau relevé")).toBeInTheDocument();
    expect(screen.getByText("Consommation")).toBeInTheDocument();
  });

  it("pre-fills initial readings when provided", () => {
    const initialReadings = [
      {
        unitId: "unit-a",
        previousReading: 100,
        currentReading: 150,
        readingDate: "2025-12-15",
      },
    ];

    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        units={mockUnits}
        initialReadings={initialReadings}
      />,
    );

    const previousInputs = screen.getAllByLabelText(/Ancien relevé/);
    expect(previousInputs[0]).toHaveValue(100);

    const currentInputs = screen.getAllByLabelText(/Nouveau relevé/);
    expect(currentInputs[0]).toHaveValue(150);
  });

  it("shows submit button with correct label", () => {
    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        units={mockUnits}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Enregistrer les relevés" }),
    ).toBeInTheDocument();
  });

  it("shows submitting state", () => {
    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={true}
        units={mockUnits}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Enregistrement…" }),
    ).toBeDisabled();
  });

  it("shows validation error when currentReading < previousReading", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={onSubmit}
        isSubmitting={false}
        units={[mockUnits[0]]}
      />,
    );

    const previousInput = screen.getByLabelText("Ancien relevé Apt 1A");
    const currentInput = screen.getByLabelText("Nouveau relevé Apt 1A");

    await user.clear(previousInput);
    await user.type(previousInput, "200");
    await user.clear(currentInput);
    await user.type(currentInput, "100");

    await user.click(
      screen.getByRole("button", { name: "Enregistrer les relevés" }),
    );

    expect(
      screen.getByText(/relevé actuel du lot "Apt 1A" doit être supérieur/),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders date inputs for each unit", () => {
    renderWithProviders(
      <WaterMeterReadingsForm
        onSubmit={vi.fn()}
        isSubmitting={false}
        units={mockUnits}
      />,
    );

    expect(screen.getByLabelText("Date relevé Apt 1A")).toBeInTheDocument();
    expect(screen.getByLabelText("Date relevé Apt 2B")).toBeInTheDocument();
  });
});
