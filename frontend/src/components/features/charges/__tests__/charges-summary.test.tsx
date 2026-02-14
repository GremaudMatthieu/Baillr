import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
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
      { category: "water", label: "Eau", amountCents: 50000 },
      { category: "electricity", label: "Électricité", amountCents: 30000 },
    ];
    const provisions = {
      totalProvisionsCents: 60000,
      details: [
        { label: "Eau", totalCents: 40000 },
        { label: "Électricité", totalCents: 20000 },
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
      { category: "water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 30000,
      details: [{ label: "Eau", totalCents: 30000 }],
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
      { category: "water", label: "Eau", amountCents: 30000 },
    ];
    const provisions = {
      totalProvisionsCents: 50000,
      details: [{ label: "Eau", totalCents: 50000 }],
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
      { category: "water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 50000,
      details: [{ label: "Eau", totalCents: 50000 }],
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
      { category: "water", label: "Eau", amountCents: 50000 },
    ];
    const provisions = {
      totalProvisionsCents: 80000,
      details: [
        { label: "Eau", totalCents: 40000 },
        { label: "Entretien espaces verts", totalCents: 40000 },
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

  it("renders with null provisions", () => {
    const charges = [
      { category: "water", label: "Eau", amountCents: 50000 },
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
});
