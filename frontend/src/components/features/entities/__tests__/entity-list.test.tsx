import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { EntityList } from "../entity-list";
import type { EntityData } from "@/lib/api/entities-api";

const mockEntities: EntityData[] = [
  {
    id: "entity-1",
    userId: "user_test123",
    type: "sci",
    name: "SCI Alpha",
    email: "test@example.com",
    siret: "12345678901234",
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
    email: "test@example.com",
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

const mockUseEntities = vi.fn();

vi.mock("@/hooks/use-entities", () => ({
  useEntities: (...args: unknown[]) => mockUseEntities(...args),
  useCreateEntity: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
  useUpdateEntity: vi.fn(() => ({ isPending: false, mutateAsync: vi.fn() })),
}));

describe("EntityList", () => {
  it("should display loading state", () => {
    mockUseEntities.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<EntityList />);
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("should display error state", () => {
    mockUseEntities.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("fail"),
    });

    renderWithProviders(<EntityList />);
    expect(
      screen.getByText("Erreur lors du chargement des entités"),
    ).toBeInTheDocument();
  });

  it("should display empty state with create link", () => {
    mockUseEntities.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<EntityList />);
    expect(screen.getByText("Aucune entité créée")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Créer une entité/i }),
    ).toHaveAttribute("href", "/entities/new");
  });

  it("should render entity cards when data is available", () => {
    mockUseEntities.mockReturnValue({
      data: mockEntities,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<EntityList />);
    expect(screen.getByText("SCI Alpha")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });
});
