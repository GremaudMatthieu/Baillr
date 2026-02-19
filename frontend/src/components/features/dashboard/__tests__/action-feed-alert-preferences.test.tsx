import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";

const mockEntityId = "entity-1";
const mockUseCurrentEntity = vi.fn();
const mockUseAlertPreferences = vi.fn();

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: (...args: unknown[]) => mockUseCurrentEntity(...args),
}));

vi.mock("@/hooks/use-alert-preferences", () => ({
  useAlertPreferences: (...args: unknown[]) =>
    mockUseAlertPreferences(...args),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({ data: [{ id: "ba-1" }] }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({ data: [{ id: "p-1" }] }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnits: () => ({ data: [{ id: "u-1" }] }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({ data: [{ id: "t-1", firstName: "Jean", lastName: "Dupont", renewalDate: null }] }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: [{ id: "l-1", endDate: null }],
  }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({
    data: [{ id: "rc-1", sentAt: "2026-01-15", paymentStatus: "paid" }],
  }),
}));

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: [{ id: "bs-1" }] }),
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
  useRevisions: () => ({ data: [] }),
}));

describe("ActionFeed — Alert Preferences Info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentEntity.mockReturnValue({
      entityId: mockEntityId,
      entity: { id: mockEntityId, name: "SCI Test" },
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });
  });

  it("should show alert preferences info when preferences are enabled", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: true },
        { alertType: "escalation_threshold", enabled: false },
      ],
      isLoading: false,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Alertes email actives (2 types)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vous recevez des alertes par email pour cette entité. Gérez vos préférences dans les paramètres.",
      ),
    ).toBeInTheDocument();
  });

  it("should show singular 'type' when only one preference is enabled", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: false },
        { alertType: "escalation_threshold", enabled: false },
      ],
      isLoading: false,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Alertes email actives (1 type)"),
    ).toBeInTheDocument();
  });

  it("should not show alert preferences info when all preferences are disabled", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: false },
        { alertType: "insurance_expiring", enabled: false },
        { alertType: "escalation_threshold", enabled: false },
      ],
      isLoading: false,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/Alertes email actives/),
    ).not.toBeInTheDocument();
  });

  it("should not show alert preferences info when no entity is selected", () => {
    mockUseCurrentEntity.mockReturnValue({
      entityId: null,
      entity: null,
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });
    mockUseAlertPreferences.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/Alertes email actives/),
    ).not.toBeInTheDocument();
  });

  it("should not show alert preferences info when preferences are loading", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText(/Alertes email actives/),
    ).not.toBeInTheDocument();
  });

  it("should link to entity edit page for managing preferences", () => {
    mockUseAlertPreferences.mockReturnValue({
      data: [
        { alertType: "unpaid_rent", enabled: true },
        { alertType: "insurance_expiring", enabled: true },
        { alertType: "escalation_threshold", enabled: true },
      ],
      isLoading: false,
    });

    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Alertes email actives (3 types)"),
    ).toBeInTheDocument();

    // The action feed renders a "Commencer" link for items with href
    const links = screen.getAllByRole("link", { name: /Commencer/i });
    const alertLink = links.find(
      (link) =>
        link.getAttribute("href") === `/entities/${mockEntityId}/edit`,
    );
    expect(alertLink).toBeDefined();
  });
});
