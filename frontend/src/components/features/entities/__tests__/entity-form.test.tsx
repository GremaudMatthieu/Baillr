import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { EntityForm } from "../entity-form";
import type { EntityData } from "@/lib/api/entities-api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/entities/new",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockCreateMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUpdateMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/use-entities", () => ({
  useCreateEntity: () => ({
    isPending: false,
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateEntity: () => ({
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
          label: "1 Rue de la Paix, 75001 Paris",
          name: "1 Rue de la Paix",
          postcode: "75001",
          city: "Paris",
        })
      }
    >
      Mock Address
    </button>
  ),
}));

const editEntity: EntityData = {
  id: "entity-1",
  userId: "user_test123",
  type: "sci",
  name: "SCI Les Oliviers",
  email: "test@example.com",
  siret: "12345678901234",
  addressStreet: "12 Rue des Lilas",
  addressPostalCode: "75001",
  addressCity: "Paris",
  addressCountry: "France",
  addressComplement: null,
  legalInformation: null,
  latePaymentDelayDays: 5,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("EntityForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with empty fields", () => {
    renderWithProviders(<EntityForm />);
    expect(
      screen.getByRole("button", { name: /Créer l'entité/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SCI Les Oliviers/)).toHaveValue("");
  });

  it("should render edit form with prefilled fields", () => {
    renderWithProviders(<EntityForm entity={editEntity} />);
    expect(
      screen.getByRole("button", { name: /Enregistrer/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/SCI Les Oliviers/)).toHaveValue(
      "SCI Les Oliviers",
    );
  });

  it("should show SIRET field for SCI type", () => {
    renderWithProviders(<EntityForm />);
    // Default type is SCI, so SIRET field should be visible
    expect(screen.getByPlaceholderText(/12345678901234/)).toBeInTheDocument();
  });

  it("should display cancel button that navigates to entities", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EntityForm />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockPush).toHaveBeenCalledWith("/entities");
  });

  it("should validate required name field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EntityForm />);

    await user.click(
      screen.getByRole("button", { name: /Créer l'entité/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument();
    });
  });

  it("should fill address fields when AddressAutocomplete selects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EntityForm />);

    await user.click(screen.getByTestId("mock-address-autocomplete"));

    expect(
      screen.getByPlaceholderText(/Utilisez la recherche ci-dessus/),
    ).toHaveValue("1 Rue de la Paix");
  });

  it("should show address locked state after selection", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EntityForm />);

    await user.click(screen.getByTestId("mock-address-autocomplete"));

    expect(
      screen.getByText("Adresse sélectionnée via la recherche"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modifier/i })).toBeInTheDocument();
  });

  it("should unlock address fields when Modifier is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<EntityForm />);

    await user.click(screen.getByTestId("mock-address-autocomplete"));
    await user.click(screen.getByRole("button", { name: /Modifier/i }));

    expect(screen.getByTestId("mock-address-autocomplete")).toBeInTheDocument();
  });

  it("should render form with noValidate attribute", () => {
    const { container } = renderWithProviders(<EntityForm />);
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("novalidate");
  });

  it("should show address locked when editing entity with address", () => {
    renderWithProviders(<EntityForm entity={editEntity} />);
    expect(
      screen.getByText("Adresse sélectionnée via la recherche"),
    ).toBeInTheDocument();
  });
});
