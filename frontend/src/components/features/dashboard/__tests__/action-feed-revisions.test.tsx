import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";
import type { Revision } from "@/lib/api/revisions-api";

let mockRevisionsData: Revision[] | undefined = undefined;

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
  useChargeRegularizations: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-revisions", () => ({
  useRevisions: () => ({ data: mockRevisionsData }),
}));

vi.mock("@/hooks/use-alert-preferences", () => ({
  useAlertPreferences: () => ({ data: undefined, isLoading: false }),
}));

const makeRevision = (
  overrides: Partial<Revision> = {},
): Revision => ({
  id: overrides.id ?? "rev-1",
  leaseId: "lease-1",
  entityId: "entity-1",
  userId: "user-1",
  tenantId: "tenant-1",
  unitId: "unit-1",
  tenantName: overrides.tenantName ?? "Jean Dupont",
  unitLabel: "Appartement A",
  currentRentCents: 80000,
  newRentCents: 82000,
  differenceCents: 2000,
  baseIndexValue: 130.52,
  baseIndexQuarter: "Q2",
  baseIndexYear: 2025,
  newIndexValue: 132.42,
  newIndexQuarter: "Q3",
  newIndexYear: 2025,
  revisionIndexType: "IRL",
  status: overrides.status ?? "pending",
  calculatedAt: overrides.calculatedAt ?? "2026-02-10T10:00:00Z",
  approvedAt: overrides.approvedAt ?? null,
});

describe("ActionFeed — revision alerts", () => {
  beforeEach(() => {
    mockRevisionsData = undefined;
  });

  it("should show no alert when no revisions exist", () => {
    mockRevisionsData = [];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/révision.*en attente d'approbation/),
    ).not.toBeInTheDocument();
  });

  it("should show no alert when all revisions are approved", () => {
    mockRevisionsData = [
      makeRevision({ status: "approved", approvedAt: "2026-02-15T10:00:00Z" }),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/révision.*en attente d'approbation/),
    ).not.toBeInTheDocument();
  });

  it("should show alert for 1 pending revision", () => {
    mockRevisionsData = [makeRevision()];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("1 révision en attente d'approbation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Locataires : Jean Dupont/),
    ).toBeInTheDocument();
  });

  it("should show alert with plural for multiple pending revisions", () => {
    mockRevisionsData = [
      makeRevision({ id: "rev-1", tenantName: "Jean Dupont" }),
      makeRevision({ id: "rev-2", tenantName: "Marie Martin" }),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("2 révisions en attente d'approbation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Locataires : Jean Dupont, Marie Martin/),
    ).toBeInTheDocument();
  });

  it("should only count pending revisions (not approved)", () => {
    mockRevisionsData = [
      makeRevision({ id: "rev-1", tenantName: "Jean Dupont" }),
      makeRevision({
        id: "rev-2",
        tenantName: "Marie Martin",
        status: "approved",
        approvedAt: "2026-02-15T10:00:00Z",
      }),
    ];
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("1 révision en attente d'approbation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Locataires : Jean Dupont/),
    ).toBeInTheDocument();
  });

  it("should show Recommandé priority label", () => {
    mockRevisionsData = [makeRevision()];
    renderWithProviders(<ActionFeed />);

    // "Recommandé" is the label for "high" priority
    const items = screen.getAllByText("Recommandé");
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("should link to /revisions", () => {
    mockRevisionsData = [makeRevision()];
    renderWithProviders(<ActionFeed />);

    const links = screen.getAllByRole("link", { name: /Commencer/ });
    const revisionsLink = links.find(
      (link) => link.getAttribute("href") === "/revisions",
    );
    expect(revisionsLink).toBeDefined();
  });

  it("should show no alert when revisions data is undefined (loading)", () => {
    mockRevisionsData = undefined;
    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/révision.*en attente d'approbation/),
    ).not.toBeInTheDocument();
  });

  it("should display timestamp from calculatedAt on revision alert", () => {
    mockRevisionsData = [
      makeRevision({ calculatedAt: "2026-02-10T10:00:00Z" }),
    ];
    renderWithProviders(<ActionFeed />);

    const articles = screen.getAllByRole("article");
    const revisionArticle = articles.find((el) =>
      el.textContent?.includes("révision"),
    );
    expect(revisionArticle).toBeDefined();
    const timeEl = revisionArticle!.querySelector("time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl).toHaveAttribute("datetime", "2026-02-10T10:00:00Z");
  });
});
