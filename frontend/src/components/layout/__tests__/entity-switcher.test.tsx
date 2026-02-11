import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/test-utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EntitySwitcher } from "../entity-switcher";
import type { EntityData } from "@/lib/api/entities-api";
import type { ReactNode } from "react";

/** EntitySwitcher uses Tooltip in collapsed mode — requires TooltipProvider */
function renderSwitcher(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>{children}</TooltipProvider>
      </QueryClientProvider>
    ),
  });
}

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseEntityContext = vi.fn();

vi.mock("@/contexts/entity-context", () => ({
  useEntityContext: () => mockUseEntityContext(),
}));

const entities: EntityData[] = [
  {
    id: "entity-1",
    userId: "user_test123",
    type: "sci",
    name: "SCI Alpha",
    siret: null,
    addressStreet: "1 Rue",
    addressPostalCode: "75001",
    addressCity: "Paris",
    addressCountry: "France",
    addressComplement: null,
    legalInformation: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "entity-2",
    userId: "user_test123",
    type: "nom_propre",
    name: "Jean Dupont",
    siret: null,
    addressStreet: "2 Rue",
    addressPostalCode: "69001",
    addressCity: "Lyon",
    addressCountry: "France",
    addressComplement: null,
    legalInformation: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

describe("EntitySwitcher", () => {
  it("should display loading skeleton when isLoading", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: null,
      setCurrentEntityId: vi.fn(),
      currentEntity: null,
      entities: [],
      isLoading: true,
    });

    renderSwitcher(<EntitySwitcher />);
    // Should not show entity name or create link
    expect(screen.queryByText("SCI Alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("Aucune entité")).not.toBeInTheDocument();
  });

  it("should display collapsed loading skeleton", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: null,
      setCurrentEntityId: vi.fn(),
      currentEntity: null,
      entities: [],
      isLoading: true,
    });

    renderSwitcher(<EntitySwitcher collapsed />);
    expect(screen.queryByText("SCI Alpha")).not.toBeInTheDocument();
  });

  it("should display empty state with create link when no entities", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: null,
      setCurrentEntityId: vi.fn(),
      currentEntity: null,
      entities: [],
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher />);
    expect(
      screen.getByRole("link", { name: /Créer votre première entité/i }),
    ).toHaveAttribute("href", "/entities/new");
    expect(screen.getByText("Aucune entité")).toBeInTheDocument();
  });

  it("should display collapsed empty state with create link", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: null,
      setCurrentEntityId: vi.fn(),
      currentEntity: null,
      entities: [],
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher collapsed />);
    // In collapsed mode, the "+" link is inside a Tooltip — the link itself should render
    const links = screen.getAllByRole("link");
    const createLink = links.find((l) => l.getAttribute("href") === "/entities/new");
    expect(createLink).toBeDefined();
    expect(createLink?.textContent).toBe("+");
  });

  it("should display single entity without dropdown", () => {
    const singleEntity = entities[0];
    mockUseEntityContext.mockReturnValue({
      currentEntityId: singleEntity.id,
      setCurrentEntityId: vi.fn(),
      currentEntity: singleEntity,
      entities: [singleEntity],
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher />);
    expect(screen.getByText("SCI Alpha")).toBeInTheDocument();
    expect(screen.getByText("SCI")).toBeInTheDocument();
    // No dropdown trigger
    expect(
      screen.queryByRole("button", { name: /Sélecteur d'entité/i }),
    ).not.toBeInTheDocument();
  });

  it("should display collapsed single entity with initials", () => {
    const singleEntity = entities[0];
    mockUseEntityContext.mockReturnValue({
      currentEntityId: singleEntity.id,
      setCurrentEntityId: vi.fn(),
      currentEntity: singleEntity,
      entities: [singleEntity],
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher collapsed />);
    // Avatar initials "SA" for "SCI Alpha" — Tooltip wraps the div but the text renders
    expect(screen.getByText("SA")).toBeInTheDocument();
  });

  it("should display dropdown trigger for multiple entities", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: "entity-1",
      setCurrentEntityId: vi.fn(),
      currentEntity: entities[0],
      entities,
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher />);
    expect(
      screen.getByRole("button", { name: /Sélecteur d'entité/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("SCI Alpha")).toBeInTheDocument();
  });

  it("should display collapsed dropdown trigger for multiple entities", () => {
    mockUseEntityContext.mockReturnValue({
      currentEntityId: "entity-1",
      setCurrentEntityId: vi.fn(),
      currentEntity: entities[0],
      entities,
      isLoading: false,
    });

    renderSwitcher(<EntitySwitcher collapsed />);
    expect(
      screen.getByRole("button", { name: /Sélecteur d'entité/i }),
    ).toBeInTheDocument();
  });
});
