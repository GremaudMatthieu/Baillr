import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { LeaseForm } from "../lease-form";

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: mockBack,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/leases/new",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: "entity-1",
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

const mockCreateMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: [],
    isLoading: false,
    isError: false,
  }),
  useCreateLease: () => ({
    isPending: false,
    mutateAsync: mockCreateMutateAsync,
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({
    data: [
      {
        id: "t1",
        firstName: "Jean",
        lastName: "Dupont",
        companyName: null,
      },
      {
        id: "t2",
        firstName: "Marie",
        lastName: "Martin",
        companyName: "SCI Oliviers",
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: () => ({
    data: [
      {
        id: "u1",
        identifier: "Apt A1",
        propertyName: "Résidence Parc",
        propertyId: "p1",
        type: "apartment",
        floor: 2,
        surfaceArea: 45,
        userId: "user_1",
        billableOptions: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      {
        id: "u2",
        identifier: "Parking B3",
        propertyName: "Résidence Parc",
        propertyId: "p1",
        type: "parking",
        floor: -1,
        surfaceArea: 0,
        userId: "user_1",
        billableOptions: [],
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ],
    isLoading: false,
  }),
}));

describe("LeaseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all form fields", () => {
    renderWithProviders(<LeaseForm />);

    expect(screen.getByText("Locataire")).toBeInTheDocument();
    expect(screen.getByText("Lot (vacant)")).toBeInTheDocument();
    expect(screen.getByText("Date de début")).toBeInTheDocument();
    expect(screen.getByText("Loyer mensuel (€)")).toBeInTheDocument();
    expect(screen.getByText("Dépôt de garantie (€)")).toBeInTheDocument();
    expect(screen.getByText("Jour d'échéance")).toBeInTheDocument();
    expect(screen.getByText("Indice de révision")).toBeInTheDocument();
  });

  it("should render submit and cancel buttons", () => {
    renderWithProviders(<LeaseForm />);

    expect(
      screen.getByRole("button", { name: /créer le bail/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /annuler/i }),
    ).toBeInTheDocument();
  });

  it("should navigate back on cancel click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LeaseForm />);

    await user.click(screen.getByRole("button", { name: /annuler/i }));

    expect(mockBack).toHaveBeenCalled();
  });

  it("should show tenant select placeholder", () => {
    renderWithProviders(<LeaseForm />);

    expect(
      screen.getByText("Sélectionnez un locataire"),
    ).toBeInTheDocument();
  });

  it("should show unit select placeholder", () => {
    renderWithProviders(<LeaseForm />);

    expect(screen.getByText("Sélectionnez un lot")).toBeInTheDocument();
  });

  it("should have default values for due date and index type", () => {
    renderWithProviders(<LeaseForm />);

    // monthlyDueDate defaults to 5
    const dueDateInput = screen.getByLabelText("Jour d'échéance");
    expect(dueDateInput).toHaveValue(5);
  });
});
