import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import RevisionsPage from "@/app/(auth)/revisions/page";

const mockEntityId = vi.fn<() => string | null>(() => "entity-123");

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: mockEntityId(),
    entity: null,
    entities: [],
    setEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-revisions", () => ({
  useRevisions: () => ({
    data: [
      {
        id: "rev-1",
        leaseId: "lease-1",
        entityId: "entity-123",
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
    ],
    isLoading: false,
    error: null,
  }),
  useCalculateRevisions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    reset: vi.fn(),
  }),
}));

describe("RevisionsPage", () => {
  it("renders no-entity state when no entity selected", () => {
    mockEntityId.mockReturnValue(null);
    renderWithProviders(<RevisionsPage />);

    expect(
      screen.getByText("Sélectionnez une entité pour voir les révisions."),
    ).toBeInTheDocument();
  });

  it("renders page title", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<RevisionsPage />);

    expect(
      screen.getByRole("heading", { name: "Révisions de loyer" }),
    ).toBeInTheDocument();
  });

  it("renders revision table with data", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<RevisionsPage />);

    expect(screen.getByText("Dupont Jean")).toBeInTheDocument();
    expect(screen.getByText("Apt A")).toBeInTheDocument();
    expect(screen.getByText("IRL")).toBeInTheDocument();
  });

  it("renders calculate button", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<RevisionsPage />);

    expect(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    ).toBeInTheDocument();
  });
});
