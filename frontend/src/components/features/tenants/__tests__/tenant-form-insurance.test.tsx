import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { TenantForm } from "../tenant-form";
import type { TenantData } from "@/lib/api/tenants-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
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

vi.mock("@/hooks/use-tenants", () => ({
  useRegisterTenant: () => ({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
  useUpdateTenant: () => ({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/components/ui/address-autocomplete", () => ({
  AddressAutocomplete: () => <div data-testid="mock-address-autocomplete" />,
}));

const baseTenant: TenantData = {
  id: "tenant-1",
  entityId: "entity-1",
  userId: "user_test123",
  type: "individual",
  firstName: "Jean",
  lastName: "Dupont",
  companyName: null,
  siret: null,
  email: "jean@example.com",
  phoneNumber: null,
  addressStreet: null,
  addressPostalCode: null,
  addressCity: null,
  addressComplement: null,
  insuranceProvider: null,
  policyNumber: null,
  renewalDate: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("TenantForm — insurance section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render insurance fieldset in create mode", () => {
    renderWithProviders(<TenantForm />);
    expect(
      screen.getByText("Assurance habitation (optionnel)"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("MAIF, AXA, etc.")).toHaveValue("");
    expect(screen.getByPlaceholderText("POL-2026-001")).toHaveValue("");
  });

  it("should render empty insurance fields when tenant has no insurance", () => {
    renderWithProviders(<TenantForm tenant={baseTenant} />);
    expect(screen.getByPlaceholderText("MAIF, AXA, etc.")).toHaveValue("");
    expect(screen.getByPlaceholderText("POL-2026-001")).toHaveValue("");
  });

  it("should prefill insurance fields when editing tenant with insurance", () => {
    const tenantWithInsurance: TenantData = {
      ...baseTenant,
      insuranceProvider: "MAIF",
      policyNumber: "POL-2026-999",
      renewalDate: "2027-03-15T00:00:00.000Z",
    };

    renderWithProviders(<TenantForm tenant={tenantWithInsurance} />);
    expect(screen.getByPlaceholderText("MAIF, AXA, etc.")).toHaveValue("MAIF");
    expect(screen.getByPlaceholderText("POL-2026-001")).toHaveValue(
      "POL-2026-999",
    );
    // Date input should show YYYY-MM-DD
    const dateInput = screen.getByLabelText("Date de renouvellement");
    expect(dateInput).toHaveValue("2027-03-15");
  });
});
