import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed, type ActionItem } from "../action-feed";

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: null,
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnits: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: undefined }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatuses: () => ({ data: [] }),
}));

describe("ActionFeed", () => {
  it("should display section heading", () => {
    renderWithProviders(<ActionFeed actions={[]} />);
    expect(
      screen.getByRole("heading", { name: /Actions en attente/i }),
    ).toBeInTheDocument();
  });

  it("should display empty state when no actions", () => {
    renderWithProviders(<ActionFeed actions={[]} />);
    expect(
      screen.getByText("Aucune action en attente"),
    ).toBeInTheDocument();
  });

  it("should display action cards when actions provided", () => {
    const actions: ActionItem[] = [
      {
        id: "action-1",
        icon: "Plus",
        title: "Créez votre première entité propriétaire",
        description: "Commencez par configurer votre SCI",
        href: "/entities/new",
        priority: "high",
      },
    ];

    renderWithProviders(<ActionFeed actions={actions} />);
    expect(
      screen.getByText("Créez votre première entité propriétaire"),
    ).toBeInTheDocument();
    expect(screen.getByText("Recommandé")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Commencer/i }),
    ).toHaveAttribute("href", "/entities/new");
  });

  it("should display correct priority labels", () => {
    const actions: ActionItem[] = [
      {
        id: "action-1",
        icon: "Plus",
        title: "Action haute",
        description: "Desc",
        priority: "high",
      },
      {
        id: "action-2",
        icon: "Building2",
        title: "Action moyenne",
        description: "Desc",
        priority: "medium",
      },
      {
        id: "action-3",
        icon: "Landmark",
        title: "Action basse",
        description: "Desc",
        priority: "low",
      },
    ];

    renderWithProviders(<ActionFeed actions={actions} />);
    expect(screen.getByText("Recommandé")).toBeInTheDocument();
    expect(screen.getByText("Suggéré")).toBeInTheDocument();
    expect(screen.getByText("Optionnel")).toBeInTheDocument();
  });

  it("should not display Commencer link when action has no href", () => {
    const actions: ActionItem[] = [
      {
        id: "action-1",
        icon: "Plus",
        title: "Action sans lien",
        description: "Desc",
        priority: "medium",
      },
    ];

    renderWithProviders(<ActionFeed actions={actions} />);
    expect(screen.queryByRole("link", { name: /Commencer/i })).not.toBeInTheDocument();
  });

  it("should render list with accessible label", () => {
    renderWithProviders(<ActionFeed actions={[]} />);
    expect(
      screen.getByRole("list", { name: "Actions en attente" }),
    ).toBeInTheDocument();
  });

  it("should display onboarding actions when no actions prop and no entity", () => {
    renderWithProviders(<ActionFeed />);
    // With no entityId, should show "create entity" onboarding action
    expect(
      screen.getByText("Créez votre première entité propriétaire"),
    ).toBeInTheDocument();
  });

  it("should display receipt prompt action when provided", () => {
    const actions: ActionItem[] = [
      {
        id: "onboarding-download-receipts",
        icon: "FileCheck",
        title: "Envoyez les quittances de loyer",
        description:
          "Des paiements ont été enregistrés — téléchargez les quittances pour vos locataires",
        href: "/rent-calls",
        priority: "medium",
      },
    ];

    renderWithProviders(<ActionFeed actions={actions} />);
    expect(
      screen.getByText("Envoyez les quittances de loyer"),
    ).toBeInTheDocument();
    expect(screen.getByText("Suggéré")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Commencer/i }),
    ).toHaveAttribute("href", "/rent-calls");
  });

  it("should not display receipt prompt when no paid rent calls", () => {
    renderWithProviders(<ActionFeed actions={[]} />);
    expect(
      screen.queryByText("Envoyez les quittances de loyer"),
    ).not.toBeInTheDocument();
  });
});
