import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import IndicesPage from "@/app/(auth)/indices/page";

const mockEntityId = vi.fn<() => string | null>(() => "entity-123");
const mockFetchMutate = vi.fn();
let mockFetchIsPending = false;

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
        source: "manual",
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
  useFetchInseeIndices: () => ({
    mutate: mockFetchMutate,
    isPending: mockFetchIsPending,
    isError: false,
  }),
}));

describe("IndicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchIsPending = false;
  });

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

  it("renders fetch button (AC #1)", () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    expect(
      screen.getByRole("button", { name: /Récupérer les indices INSEE/ }),
    ).toBeInTheDocument();
  });

  it("calls fetchMutation on fetch button click", async () => {
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Récupérer les indices INSEE/ }),
    );

    expect(mockFetchMutate).toHaveBeenCalledTimes(1);
  });

  it("displays success summary after fetch (AC #2)", async () => {
    mockFetchMutate.mockImplementation((_: unknown, options: { onSuccess: (r: { newIndices: number; skipped: number }) => void }) => {
      options.onSuccess({ newIndices: 5, skipped: 3 });
    });
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Récupérer les indices INSEE/ }),
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "5 nouveaux indices enregistrés, 3 déjà présents.",
    );
  });

  it("displays error message when fetch fails (AC #5)", async () => {
    mockFetchMutate.mockImplementation((_: unknown, options: { onError: () => void }) => {
      options.onError();
    });
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Récupérer les indices INSEE/ }),
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Le service INSEE est temporairement indisponible. Saisissez les indices manuellement.",
    );
  });

  it("displays special message when no indices available (M3)", async () => {
    mockFetchMutate.mockImplementation((_: unknown, options: { onSuccess: (r: { newIndices: number; skipped: number }) => void }) => {
      options.onSuccess({ newIndices: 0, skipped: 0 });
    });
    mockEntityId.mockReturnValue("entity-123");
    renderWithProviders(<IndicesPage />);

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /Récupérer les indices INSEE/ }),
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "Aucun indice disponible sur le service INSEE.",
    );
  });
});
