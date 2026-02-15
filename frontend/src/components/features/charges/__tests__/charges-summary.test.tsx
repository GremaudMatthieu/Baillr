import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ChargesSummary } from "../charges-summary";

describe("ChargesSummary", () => {
  it("shows empty state when no charges", () => {
    renderWithProviders(
      <ChargesSummary
        charges={[]}
        provisions={null}
        totalChargesCents={0}
      />,
    );

    expect(
      screen.getByText("Aucune charge enregistrée pour cet exercice."),
    ).toBeInTheDocument();
  });

  it("renders table with charges and provisions", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
      { chargeCategoryId: "cat-elec", label: "Électricité", amountCents: 30000 },
    ];
    const provisions = {
      totalProvisionsCents: 60000,
      details: [
        { chargeCategoryId: "cat-water", categoryLabel: "Eau", totalCents: 40000 },
        { chargeCategoryId: "cat-elec", categoryLabel: "Électricité", totalCents: 20000 },
      ],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={80000}
      />,
    );

    // Headers
    expect(screen.getByText("Catégorie")).toBeInTheDocument();
    expect(screen.getByText("Charges réelles")).toBeInTheDocument();
    expect(screen.getByText("Provisions")).toBeInTheDocument();
    expect(screen.getByText("Différence")).toBeInTheDocument();

    // Category labels
    expect(screen.getByText("Eau")).toBeInTheDocument();
    expect(screen.getByText("Électricité")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
  });

  it("shows positive difference message when charges exceed provisions", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 30000,
      details: [{ chargeCategoryId: "cat-water", categoryLabel: "Eau", totalCents: 30000 }],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={50000}
      />,
    );

    expect(
      screen.getByText(
        "Différence positive : le locataire doit un complément.",
      ),
    ).toBeInTheDocument();
  });

  it("shows negative difference message when provisions exceed charges", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 30000 },
    ];
    const provisions = {
      totalProvisionsCents: 50000,
      details: [{ chargeCategoryId: "cat-water", categoryLabel: "Eau", totalCents: 50000 }],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={30000}
      />,
    );

    expect(
      screen.getByText(
        "Différence négative : le locataire a un trop-perçu.",
      ),
    ).toBeInTheDocument();
  });

  it("shows equilibrium message when charges equal provisions", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 50000,
      details: [{ chargeCategoryId: "cat-water", categoryLabel: "Eau", totalCents: 50000 }],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={50000}
      />,
    );

    expect(
      screen.getByText("Charges et provisions sont à l'équilibre."),
    ).toBeInTheDocument();
  });

  it("renders unmatched provisions as extra rows", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 80000,
      details: [
        { chargeCategoryId: "cat-water", categoryLabel: "Eau", totalCents: 40000 },
        { chargeCategoryId: null, categoryLabel: "Entretien espaces verts", totalCents: 40000 },
      ],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={50000}
      />,
    );

    // Unmatched provision should appear as an extra row
    expect(screen.getByText("Entretien espaces verts")).toBeInTheDocument();
  });

  it("matches charges to provisions by chargeCategoryId", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau froide", amountCents: 50000 },
      { chargeCategoryId: "cat-elec", label: "Électricité parties communes", amountCents: 30000 },
    ];
    const provisions = {
      totalProvisionsCents: 60000,
      details: [
        { chargeCategoryId: "cat-water", categoryLabel: "Eau (provisions)", totalCents: 40000 },
        { chargeCategoryId: "cat-elec", categoryLabel: "Élec (provisions)", totalCents: 20000 },
      ],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={80000}
      />,
    );

    // Charge labels should be displayed (not provision labels)
    expect(screen.getByText("Eau froide")).toBeInTheDocument();
    expect(screen.getByText("Électricité parties communes")).toBeInTheDocument();
    // Provision-only labels should NOT appear since they matched by chargeCategoryId
    expect(screen.queryByText("Eau (provisions)")).not.toBeInTheDocument();
    expect(screen.queryByText("Élec (provisions)")).not.toBeInTheDocument();
  });

  it("falls back to label matching for legacy data without chargeCategoryId", () => {
    const charges = [
      { chargeCategoryId: "", label: "Gardiennage", amountCents: 20000 },
    ];
    const provisions = {
      totalProvisionsCents: 35000,
      details: [
        { chargeCategoryId: null, categoryLabel: "Gardiennage", totalCents: 15000 },
        { chargeCategoryId: null, categoryLabel: "Jardin", totalCents: 20000 },
      ],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={provisions}
        totalChargesCents={20000}
      />,
    );

    // Both labels should appear since null category matching falls back to label
    expect(screen.getByText("Gardiennage")).toBeInTheDocument();
    // "Jardin" is unmatched provision → should appear as extra row
    expect(screen.getByText("Jardin")).toBeInTheDocument();
  });

  it("renders with null provisions", () => {
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={null}
        totalChargesCents={50000}
      />,
    );

    // Should still render the table
    expect(screen.getByText("Eau")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
  });

  it("shows expandable water detail when distribution data provided", async () => {
    const user = userEvent.setup();
    const charges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 60000 },
    ];
    const units = [
      { id: "unit-a", propertyId: "p1", userId: "u1", identifier: "Apt 1A", type: "apartment", floor: 1, surfaceArea: 45, billableOptions: [], createdAt: "", updatedAt: "" },
      { id: "unit-b", propertyId: "p1", userId: "u1", identifier: "Apt 2B", type: "apartment", floor: 2, surfaceArea: 60, billableOptions: [], createdAt: "", updatedAt: "" },
    ];
    const waterDistribution = {
      totalWaterCents: 60000,
      totalConsumption: 160,
      distributions: [
        { unitId: "unit-a", consumption: 50, percentage: 31.3, isMetered: true, amountCents: 18750 },
        { unitId: "unit-b", consumption: 110, percentage: 68.8, isMetered: true, amountCents: 41250 },
      ],
    };

    renderWithProviders(
      <ChargesSummary
        charges={charges}
        provisions={null}
        totalChargesCents={60000}
        waterDistribution={waterDistribution}
        units={units}
      />,
    );

    // Detail rows not visible initially
    expect(screen.queryByText("Apt 1A")).not.toBeInTheDocument();

    // Click to expand
    await user.click(screen.getByText("Eau"));

    // Detail rows now visible
    expect(screen.getByText(/Apt 1A/)).toBeInTheDocument();
    expect(screen.getByText(/Apt 2B/)).toBeInTheDocument();
  });
});
