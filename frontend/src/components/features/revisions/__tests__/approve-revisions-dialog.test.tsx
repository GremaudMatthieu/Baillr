import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ApproveRevisionsDialog } from "../approve-revisions-dialog";
import type { Revision } from "@/lib/api/revisions-api";

const mockMutateAsync = vi.fn();
const mockReset = vi.fn();
let mockIsPending = false;
let mockIsError = false;

vi.mock("@/hooks/use-revisions", () => ({
  useApproveRevisions: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
    isError: mockIsError,
    reset: mockReset,
  }),
}));

const mockRevisions: Revision[] = [
  {
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
  },
];

describe("ApproveRevisionsDialog", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockReset.mockReset();
    mockIsPending = false;
    mockIsError = false;
  });

  it("renders confirmation message with revision count", () => {
    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/vous allez approuver/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 révision/)).toBeInTheDocument();
  });

  it("shows total rent impact", () => {
    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );
    // Impact is +20,97 € (2097 cents)
    expect(screen.getByText(/20,97/)).toBeInTheDocument();
  });

  it("calls mutateAsync with revision ids on approve", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);

    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approuver" }));
    expect(mockMutateAsync).toHaveBeenCalledWith(["rev-1"]);
  });

  it("shows success message after approval", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);

    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approuver" }));
    expect(
      screen.getByText(/1 révision approuvée avec succès/),
    ).toBeInTheDocument();
  });

  it("renders cancel and approve buttons", () => {
    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approuver" }),
    ).toBeInTheDocument();
  });

  it("calls onApproved callback after successful approval", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue(undefined);
    const onApproved = vi.fn();

    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={onApproved}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Approuver" }));
    expect(onApproved).toHaveBeenCalledTimes(1);
  });

  it("shows error message when approval fails", () => {
    mockIsError = true;

    renderWithProviders(
      <ApproveRevisionsDialog
        entityId="entity-1"
        revisions={mockRevisions}
        open={true}
        onOpenChange={vi.fn()}
        onApproved={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/une erreur est survenue/i),
    ).toBeInTheDocument();
  });
});
