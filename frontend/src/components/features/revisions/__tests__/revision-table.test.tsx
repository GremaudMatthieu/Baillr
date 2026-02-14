import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { RevisionTable } from "../revision-table";
import type { Revision } from "@/lib/api/revisions-api";

const mockRevision: Revision = {
  id: "rev-1",
  leaseId: "lease-1",
  entityId: "entity-1",
  userId: "user-1",
  tenantId: "tenant-1",
  unitId: "unit-1",
  tenantName: "Dupont Jean",
  unitLabel: "Apt A",
  currentRentCents: 75000,
  newRentCents: 77097,
  differenceCents: 2097,
  baseIndexValue: 138.19,
  baseIndexQuarter: "Q2",
  newIndexValue: 142.06,
  newIndexQuarter: "Q2",
  newIndexYear: 2025,
  revisionIndexType: "IRL",
  status: "pending",
  calculatedAt: "2026-02-14T10:00:00Z",
  approvedAt: null,
};

describe("RevisionTable", () => {
  it("renders empty state when no revisions", () => {
    renderWithProviders(<RevisionTable revisions={[]} />);
    expect(
      screen.getByText("Aucune révision en attente."),
    ).toBeInTheDocument();
  });

  it("renders revision data in table", () => {
    renderWithProviders(<RevisionTable revisions={[mockRevision]} />);

    expect(screen.getByText("Dupont Jean")).toBeInTheDocument();
    expect(screen.getByText("Apt A")).toBeInTheDocument();
    expect(screen.getByText("IRL")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
  });

  it("renders formula details", () => {
    renderWithProviders(<RevisionTable revisions={[mockRevision]} />);
    expect(screen.getByText(/138\.19 → 142\.06/)).toBeInTheDocument();
  });

  it("shows positive difference with +", () => {
    renderWithProviders(<RevisionTable revisions={[mockRevision]} />);
    // Positive difference should have + prefix
    const cells = screen.getAllByRole("cell");
    const diffCell = cells.find((c) => c.textContent?.includes("+"));
    expect(diffCell).toBeDefined();
  });

  it("shows approved status badge", () => {
    const approved = { ...mockRevision, status: "approved" };
    renderWithProviders(<RevisionTable revisions={[approved]} />);
    expect(screen.getByText("Approuvée")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderWithProviders(<RevisionTable revisions={[mockRevision]} />);
    expect(screen.getByText("Locataire")).toBeInTheDocument();
    expect(screen.getByText("Lot")).toBeInTheDocument();
    expect(screen.getByText("Loyer actuel")).toBeInTheDocument();
    expect(screen.getByText("Nouveau loyer")).toBeInTheDocument();
    expect(screen.getByText("Différence")).toBeInTheDocument();
    expect(screen.getByText("Indice")).toBeInTheDocument();
    expect(screen.getByText("Statut")).toBeInTheDocument();
  });
});
