import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { WaterDistributionSummary } from "../water-distribution-summary";
import type { WaterDistributionData } from "@/lib/api/water-meter-api";
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

describe("WaterDistributionSummary", () => {
  it("shows empty state when no distributions", () => {
    const distribution: WaterDistributionData = {
      totalWaterCents: 0,
      totalConsumption: 0,
      distributions: [],
    };

    renderWithProviders(
      <WaterDistributionSummary distribution={distribution} units={mockUnits} />,
    );

    expect(
      screen.getByText("Aucune répartition disponible."),
    ).toBeInTheDocument();
  });

  it("renders table with unit distributions", () => {
    const distribution: WaterDistributionData = {
      totalWaterCents: 60000,
      totalConsumption: 160,
      distributions: [
        { unitId: "unit-a", consumption: 50, percentage: 31.3, isMetered: true, amountCents: 18750 },
        { unitId: "unit-b", consumption: 110, percentage: 68.8, isMetered: true, amountCents: 41250 },
      ],
    };

    renderWithProviders(
      <WaterDistributionSummary distribution={distribution} units={mockUnits} />,
    );

    // Headers
    expect(screen.getByText("Lot")).toBeInTheDocument();
    expect(screen.getByText("Consommation (m³)")).toBeInTheDocument();
    expect(screen.getByText("Part (%)")).toBeInTheDocument();
    expect(screen.getByText("Montant")).toBeInTheDocument();

    // Unit identifiers
    expect(screen.getByText("Apt 1A")).toBeInTheDocument();
    expect(screen.getByText("Apt 2B")).toBeInTheDocument();

    // Consumption values
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("110")).toBeInTheDocument();

    // Total row
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("160")).toBeInTheDocument();
  });

  it("shows unmetered label for unmetered units", () => {
    const distribution: WaterDistributionData = {
      totalWaterCents: 60000,
      totalConsumption: 50,
      distributions: [
        { unitId: "unit-a", consumption: 50, percentage: 100, isMetered: true, amountCents: 60000 },
        { unitId: "unit-b", consumption: null, percentage: null, isMetered: false, amountCents: 0 },
      ],
    };

    renderWithProviders(
      <WaterDistributionSummary distribution={distribution} units={mockUnits} />,
    );

    expect(screen.getByText("(non mesuré)")).toBeInTheDocument();
  });

  it("renders footnote about distribution method", () => {
    const distribution: WaterDistributionData = {
      totalWaterCents: 60000,
      totalConsumption: 100,
      distributions: [
        { unitId: "unit-a", consumption: 100, percentage: 100, isMetered: true, amountCents: 60000 },
      ],
    };

    renderWithProviders(
      <WaterDistributionSummary distribution={distribution} units={mockUnits} />,
    );

    expect(
      screen.getByText(/Répartition proportionnelle/),
    ).toBeInTheDocument();
  });
});
