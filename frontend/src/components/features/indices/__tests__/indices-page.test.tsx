import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import IndicesPage from "@/app/(auth)/indices/page";

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

vi.mock("@/hooks/use-insee-indices", () => ({
  useInseeIndices: () => ({
    data: [
      {
        id: "idx-1",
        type: "IRL",
        quarter: "Q1",
        year: 2025,
        value: 142.06,
        entityId: "entity-123",
        userId: "user-1",
        createdAt: "2025-04-15T10:00:00.000Z",
      },
    ],
    isLoading: false,
  }),
  useRecordInseeIndex: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

describe("IndicesPage", () => {
  it("renders no-entity state when no entity selected", () => {
    mockEntityId.mockReturnValue(null);
    renderWithProviders(<IndicesPage />);

    expect(screen.getByText("Aucune entité sélectionnée")).toBeInTheDocument();
    expect(screen.getByText("Gérer mes entités")).toBeInTheDocument();
  });

  it("renders page title", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    expect(
      screen.getByRole("heading", { name: "Indices INSEE" }),
    ).toBeInTheDocument();
  });

  it("renders form card", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    expect(screen.getByText("Enregistrer un indice")).toBeInTheDocument();
    expect(
      screen.getByRole("form", {
        name: "Formulaire d'enregistrement d'indice INSEE",
      }),
    ).toBeInTheDocument();
  });

  it("renders index list card with data", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    expect(screen.getByText("Indices enregistrés")).toBeInTheDocument();
    expect(screen.getByText("142.06")).toBeInTheDocument();
  });
});
