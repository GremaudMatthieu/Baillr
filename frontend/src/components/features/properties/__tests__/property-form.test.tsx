import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { PropertyForm } from "../property-form";
import type { PropertyData } from "@/lib/api/properties-api";

const mockPush = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/properties/new",
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
const mockUpdateMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/use-properties", () => ({
  useCreateProperty: () => ({
    isPending: false,
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateProperty: () => ({
    isPending: false,
    mutateAsync: mockUpdateMutateAsync,
  }),
}));

vi.mock("@/components/ui/address-autocomplete", () => ({
  AddressAutocomplete: ({ onSelect }: { onSelect: (s: unknown) => void }) => (
    <button
      data-testid="mock-address-autocomplete"
      onClick={() =>
        onSelect({
          label: "10 Rue de la Paix, 75002 Paris",
          name: "10 Rue de la Paix",
          postcode: "75002",
          city: "Paris",
        })
      }
    >
      Mock Address
    </button>
  ),
}));

const editProperty: PropertyData = {
  id: "prop-1",
  entityId: "entity-1",
  userId: "user_test123",
  name: "Résidence Les Pins",
  type: "immeuble",
  addressStreet: "12 Rue des Lilas",
  addressPostalCode: "75001",
  addressCity: "Paris",
  addressCountry: "France",
  addressComplement: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("PropertyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with empty fields", () => {
    renderWithProviders(<PropertyForm />);
    expect(
      screen.getByRole("button", { name: /Créer le bien/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Résidence Les Oliviers/)).toHaveValue("");
  });

  it("should render edit form with prefilled fields", () => {
    renderWithProviders(<PropertyForm property={editProperty} />);
    expect(
      screen.getByRole("button", { name: /Enregistrer/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Résidence Les Oliviers/)).toHaveValue(
      "Résidence Les Pins",
    );
  });

  it("should show type field as optional", () => {
    renderWithProviders(<PropertyForm />);
    expect(
      screen.getByPlaceholderText(/Immeuble, Maison/),
    ).toBeInTheDocument();
  });

  it("should validate required name field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyForm />);

    await user.click(
      screen.getByRole("button", { name: /Créer le bien/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument();
    });
  });

  it("should fill address fields when AddressAutocomplete selects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyForm />);

    await user.click(screen.getByTestId("mock-address-autocomplete"));

    expect(
      screen.getByPlaceholderText(/Utilisez la recherche ci-dessus/),
    ).toHaveValue("10 Rue de la Paix");
  });

  it("should call onCancel prop when provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<PropertyForm onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should fallback to router.back when no onCancel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyForm />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("should show address locked when editing property with address", () => {
    renderWithProviders(<PropertyForm property={editProperty} />);
    expect(
      screen.getByText("Adresse sélectionnée via la recherche"),
    ).toBeInTheDocument();
  });

  it("should validate required address fields on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PropertyForm />);

    // Fill name but not address
    await user.type(screen.getByPlaceholderText(/Résidence Les Oliviers/), "Test Prop");
    await user.click(
      screen.getByRole("button", { name: /Créer le bien/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/La rue est requise/i)).toBeInTheDocument();
    });
  });
});
