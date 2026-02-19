import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { SyncBankSummary } from "../sync-bank-summary";

describe("SyncBankSummary", () => {
  it("should display imported count with institution name", () => {
    renderWithProviders(
      <SyncBankSummary imported={5} institutionName="BNP Paribas" />,
    );

    expect(screen.getByText("Synchronisation terminée")).toBeInTheDocument();
    expect(
      screen.getByText(/5 transactions importées depuis BNP Paribas/),
    ).toBeInTheDocument();
  });

  it("should display imported count without institution name", () => {
    renderWithProviders(
      <SyncBankSummary imported={3} institutionName={null} />,
    );

    expect(screen.getByText(/3 transactions importées/)).toBeInTheDocument();
  });

  it("should display singular form for one transaction", () => {
    renderWithProviders(
      <SyncBankSummary imported={1} institutionName="Crédit Agricole" />,
    );

    expect(
      screen.getByText(/1 transaction importée depuis Crédit Agricole/),
    ).toBeInTheDocument();
  });

  it("should display zero result message", () => {
    renderWithProviders(
      <SyncBankSummary imported={0} institutionName="BNP Paribas" />,
    );

    expect(
      screen.getByText(/Aucune nouvelle transaction depuis BNP Paribas/),
    ).toBeInTheDocument();
  });

  it("should display zero result without institution name", () => {
    renderWithProviders(
      <SyncBankSummary imported={0} institutionName={null} />,
    );

    expect(
      screen.getByText(/Aucune nouvelle transaction/),
    ).toBeInTheDocument();
  });
});
