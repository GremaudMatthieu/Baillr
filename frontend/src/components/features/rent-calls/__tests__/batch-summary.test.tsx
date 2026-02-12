import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { BatchSummary } from "../batch-summary";

describe("BatchSummary", () => {
  it("should display generation count and total amount", () => {
    renderWithProviders(
      <BatchSummary
        generated={3}
        totalAmountCents={214500}
        exceptions={[]}
      />,
    );

    expect(screen.getByText(/3 appels de loyer/)).toBeInTheDocument();
    expect(screen.getByText(/2.145,00/)).toBeInTheDocument();
  });

  it("should use singular for single rent call", () => {
    renderWithProviders(
      <BatchSummary
        generated={1}
        totalAmountCents={85000}
        exceptions={[]}
      />,
    );

    expect(screen.getByText(/1 appel de loyer/)).toBeInTheDocument();
    expect(screen.getByText(/généré(?!s)/)).toBeInTheDocument();
  });

  it("should display exceptions when present", () => {
    renderWithProviders(
      <BatchSummary
        generated={2}
        totalAmountCents={150000}
        exceptions={["Bail #3 : configuration manquante"]}
      />,
    );

    expect(screen.getByText("Avertissements")).toBeInTheDocument();
    expect(
      screen.getByText("Bail #3 : configuration manquante"),
    ).toBeInTheDocument();
  });

  it("should not display warnings section when no exceptions", () => {
    renderWithProviders(
      <BatchSummary
        generated={2}
        totalAmountCents={150000}
        exceptions={[]}
      />,
    );

    expect(screen.queryByText("Avertissements")).not.toBeInTheDocument();
  });
});
