import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { TenantForm } from "../tenant-form";
import type { TenantData } from "@/lib/api/tenants-api";

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: mockBack,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/tenants/new",
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

const mockRegisterMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUpdateMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/use-tenants", () => ({
  useRegisterTenant: () => ({
    isPending: false,
    mutateAsync: mockRegisterMutateAsync,
  }),
  useUpdateTenant: () => ({
    isPending: false,
    mutateAsync: mockUpdateMutateAsync,
  }),
}));

vi.mock("@/components/ui/address-autocomplete", () => ({
  AddressAutocomplete: ({
    onSelect,
  }: {
    onSelect: (s: unknown) => void;
  }) => (
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

const editTenant: TenantData = {
  id: "tenant-1",
  entityId: "entity-1",
  userId: "user_test123",
  type: "individual",
  firstName: "Jean",
  lastName: "Dupont",
  companyName: null,
  siret: null,
  email: "jean@example.com",
  phoneNumber: "+33612345678",
  addressStreet: "12 Rue des Lilas",
  addressPostalCode: "75001",
  addressCity: "Paris",
  addressComplement: null,
  insuranceProvider: null,
  policyNumber: null,
  renewalDate: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("TenantForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with empty fields", () => {
    renderWithProviders(<TenantForm />);
    expect(
      screen.getByRole("button", { name: /Enregistrer le locataire/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jean")).toHaveValue("");
    expect(screen.getByPlaceholderText("Dupont")).toHaveValue("");
  });

  it("should render edit form with prefilled fields", () => {
    renderWithProviders(<TenantForm tenant={editTenant} />);
    expect(
      screen.getByRole("button", { name: /^Enregistrer$/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Jean")).toHaveValue("Jean");
    expect(screen.getByPlaceholderText("Dupont")).toHaveValue("Dupont");
    expect(
      screen.getByPlaceholderText("jean.dupont@example.com"),
    ).toHaveValue("jean@example.com");
  });

  it("should show type selector with placeholder", () => {
    renderWithProviders(<TenantForm />);
    expect(
      screen.getByText("Sélectionnez un type"),
    ).toBeInTheDocument();
  });

  it("should validate required firstName field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TenantForm />);

    await user.click(
      screen.getByRole("button", { name: /Enregistrer le locataire/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Le prénom est requis/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate required email field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TenantForm />);

    await user.click(
      screen.getByRole("button", { name: /Enregistrer le locataire/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/L\u2019email est requis/i),
      ).toBeInTheDocument();
    });
  });

  it("should show companyName and SIRET fields when type is company", async () => {
    const companyTenant: TenantData = {
      ...editTenant,
      type: "company",
      companyName: "SCI Les Oliviers",
      siret: "12345678901234",
    };

    renderWithProviders(<TenantForm tenant={companyTenant} />);

    expect(
      screen.getByPlaceholderText("SCI Les Oliviers"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("12345678901234"),
    ).toBeInTheDocument();
  });

  it("should hide companyName and SIRET when type is individual", () => {
    renderWithProviders(<TenantForm tenant={editTenant} />);
    expect(
      screen.queryByPlaceholderText("SCI Les Oliviers"),
    ).not.toBeInTheDocument();
  });

  it("should fill address fields when AddressAutocomplete selects", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TenantForm />);

    await user.click(screen.getByTestId("mock-address-autocomplete"));

    expect(
      screen.getByPlaceholderText("Utilisez la recherche ci-dessus"),
    ).toHaveValue("10 Rue de la Paix");
  });

  it("should show address locked when editing tenant with address", () => {
    renderWithProviders(<TenantForm tenant={editTenant} />);
    expect(
      screen.getByText("Adresse sélectionnée via la recherche"),
    ).toBeInTheDocument();
  });

  it("should call onCancel prop when provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(<TenantForm onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should fallback to router.back when no onCancel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TenantForm />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("should disable type selector when editing", () => {
    renderWithProviders(<TenantForm tenant={editTenant} />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
  });
});
