import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { RevisionTable } from "../revision-table";
import type { Revision } from "@/lib/api/revisions-api";

vi.mock("@/hooks/use-revisions", () => ({
  useApproveRevisions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    reset: vi.fn(),
  }),
}));

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
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[]} />);
    expect(
      screen.getByText("Aucune révision en attente."),
    ).toBeInTheDocument();
  });

  it("renders revision data in table", () => {
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[mockRevision]} />);

    expect(screen.getByText("Dupont Jean")).toBeInTheDocument();
    expect(screen.getByText("Apt A")).toBeInTheDocument();
    expect(screen.getByText("IRL")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
  });

  it("renders formula details", () => {
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[mockRevision]} />);
    expect(screen.getByText(/138\.19 → 142\.06/)).toBeInTheDocument();
  });

  it("shows positive difference with +", () => {
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[mockRevision]} />);
    // Positive difference should have + prefix
    const cells = screen.getAllByRole("cell");
    const diffCell = cells.find((c) => c.textContent?.includes("+"));
    expect(diffCell).toBeDefined();
  });

  it("shows approved status badge", () => {
    const approved = { ...mockRevision, status: "approved" };
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[approved]} />);
    expect(screen.getByText("Approuvée")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderWithProviders(<RevisionTable entityId="entity-1" revisions={[mockRevision]} />);
    expect(screen.getByText("Locataire")).toBeInTheDocument();
    expect(screen.getByText("Lot")).toBeInTheDocument();
    expect(screen.getByText("Loyer actuel")).toBeInTheDocument();
    expect(screen.getByText("Nouveau loyer")).toBeInTheDocument();
    expect(screen.getByText("Différence")).toBeInTheDocument();
    expect(screen.getByText("Indice")).toBeInTheDocument();
    expect(screen.getByText("Statut")).toBeInTheDocument();
  });

  it("renders checkboxes for pending revisions", () => {
    renderWithProviders(
      <RevisionTable entityId="entity-1" revisions={[mockRevision]} />,
    );
    expect(
      screen.getByLabelText("Sélectionner la révision de Dupont Jean"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Sélectionner toutes les révisions en attente",
      ),
    ).toBeInTheDocument();
  });

  it("does not render checkboxes when all revisions are approved", () => {
    const approved = { ...mockRevision, status: "approved" };
    renderWithProviders(
      <RevisionTable entityId="entity-1" revisions={[approved]} />,
    );
    expect(
      screen.queryByLabelText(
        "Sélectionner toutes les révisions en attente",
      ),
    ).not.toBeInTheDocument();
  });

  it("enables approve selection button when checkbox is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RevisionTable entityId="entity-1" revisions={[mockRevision]} />,
    );

    const approveBtn = screen.getByRole("button", {
      name: /approuver la sélection/i,
    });
    expect(approveBtn).toBeDisabled();

    const checkbox = screen.getByLabelText(
      "Sélectionner la révision de Dupont Jean",
    );
    await user.click(checkbox);

    expect(approveBtn).not.toBeDisabled();
  });

  it("select all checkbox selects all pending revisions", async () => {
    const user = userEvent.setup();
    const rev2: Revision = {
      ...mockRevision,
      id: "rev-2",
      tenantName: "Martin Pierre",
    };
    renderWithProviders(
      <RevisionTable
        entityId="entity-1"
        revisions={[mockRevision, rev2]}
      />,
    );

    const selectAll = screen.getByLabelText(
      "Sélectionner toutes les révisions en attente",
    );
    await user.click(selectAll);

    expect(
      screen.getByLabelText("Sélectionner la révision de Dupont Jean"),
    ).toBeChecked();
    expect(
      screen.getByLabelText("Sélectionner la révision de Martin Pierre"),
    ).toBeChecked();
  });

  it("renders tout approuver button with pending count", () => {
    renderWithProviders(
      <RevisionTable entityId="entity-1" revisions={[mockRevision]} />,
    );
    expect(
      screen.getByRole("button", { name: /tout approuver \(1\)/i }),
    ).toBeInTheDocument();
  });
});
