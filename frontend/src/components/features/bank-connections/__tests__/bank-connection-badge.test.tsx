import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { BankConnectionBadge } from "../bank-connection-badge";

describe("BankConnectionBadge", () => {
  it("should display 'Connectée' for linked status", () => {
    renderWithProviders(<BankConnectionBadge status="linked" />);
    expect(screen.getByText("Connectée")).toBeInTheDocument();
  });

  it("should display 'Expirée' for expired status", () => {
    renderWithProviders(<BankConnectionBadge status="expired" />);
    expect(screen.getByText("Expirée")).toBeInTheDocument();
  });

  it("should display 'Suspendue' for suspended status", () => {
    renderWithProviders(<BankConnectionBadge status="suspended" />);
    expect(screen.getByText("Suspendue")).toBeInTheDocument();
  });

  it("should display 'Déconnectée' for disconnected status", () => {
    renderWithProviders(<BankConnectionBadge status="disconnected" />);
    expect(screen.getByText("Déconnectée")).toBeInTheDocument();
  });

  it("should display raw status for unknown values", () => {
    renderWithProviders(<BankConnectionBadge status="unknown_status" />);
    expect(screen.getByText("unknown_status")).toBeInTheDocument();
  });
});
