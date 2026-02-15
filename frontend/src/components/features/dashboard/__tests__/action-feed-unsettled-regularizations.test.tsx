import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";
import type { ChargeRegularizationData } from "@/lib/api/charge-regularization-api";

let mockRegularizationsData: ChargeRegularizationData[] | undefined = undefined;

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: "entity-1",
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({ data: [{ id: "ba1" }] }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({ data: [{ id: "p1" }] }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnits: () => ({ data: [{ id: "u1" }] }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatuses: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-charge-regularization", () => ({
  useChargeRegularizations: () => ({ data: mockRegularizationsData }),
}));

const makeRegularization = (
  fiscalYear: number,
  appliedAt: string | null = null,
  settledAt: string | null = null,
): ChargeRegularizationData => ({
  id: `entity-1-${fiscalYear}`,
  entityId: "entity-1",
  userId: "user-1",
  fiscalYear,
  statements: [],
  totalBalanceCents: 5000,
  appliedAt,
  sentAt: null,
  settledAt,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
});

describe("ActionFeed — unsettled regularization alerts", () => {
  beforeEach(() => {
    mockRegularizationsData = undefined;
  });

  it("should show no alert when no regularizations exist", () => {
    mockRegularizationsData = [];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/régularisation.*en attente de règlement/),
    ).not.toBeInTheDocument();
  });

  it("should show no alert when regularizations are not yet applied", () => {
    mockRegularizationsData = [makeRegularization(2025)];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/régularisation.*en attente de règlement/),
    ).not.toBeInTheDocument();
  });

  it("should show no alert when all regularizations are settled", () => {
    mockRegularizationsData = [
      makeRegularization(2025, "2026-01-15T10:00:00Z", "2026-02-01T10:00:00Z"),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/régularisation.*en attente de règlement/),
    ).not.toBeInTheDocument();
  });

  it("should show alert for 1 unsettled regularization", () => {
    mockRegularizationsData = [
      makeRegularization(2025, "2026-01-15T10:00:00Z"),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("1 régularisation en attente de règlement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exercice : 2025/),
    ).toBeInTheDocument();
  });

  it("should show alert with plural for multiple unsettled regularizations", () => {
    mockRegularizationsData = [
      makeRegularization(2024, "2026-01-10T10:00:00Z"),
      makeRegularization(2025, "2026-01-15T10:00:00Z"),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("2 régularisations en attente de règlement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exercices : 2025, 2024/),
    ).toBeInTheDocument();
  });

  it("should only count applied but not settled regularizations", () => {
    mockRegularizationsData = [
      makeRegularization(2023, "2025-01-10T10:00:00Z", "2025-03-01T10:00:00Z"), // settled
      makeRegularization(2024), // not applied
      makeRegularization(2025, "2026-01-15T10:00:00Z"), // applied, not settled
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("1 régularisation en attente de règlement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exercice : 2025/),
    ).toBeInTheDocument();
  });

  it("should link to /charges", () => {
    mockRegularizationsData = [
      makeRegularization(2025, "2026-01-15T10:00:00Z"),
    ];
    renderWithProviders(<ActionFeed />);

    const links = screen.getAllByRole("link", { name: /Commencer/ });
    const chargesLink = links.find(
      (link) => link.getAttribute("href") === "/charges",
    );
    expect(chargesLink).toBeDefined();
  });
});
