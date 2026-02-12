import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import TenantsPage from "../page";
import type { TenantData } from "@/lib/api/tenants-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/tenants",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockTenants: TenantData[] = [
  {
    id: "t1",
    entityId: "entity-1",
    userId: "user_test",
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
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "t2",
    entityId: "entity-1",
    userId: "user_test",
    type: "company",
    firstName: "Marie",
    lastName: "Martin",
    companyName: "SCI Les Oliviers",
    siret: "12345678901234",
    email: "marie@oliviers.fr",
    phoneNumber: "+33612345678",
    addressStreet: null,
    addressPostalCode: null,
    addressCity: null,
    addressComplement: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

let mockEntityId: string | null = "entity-1";
let mockTenantsData: TenantData[] | undefined = undefined;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: mockEntityId,
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({
    data: mockTenantsData,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}));

describe("TenantsPage", () => {
  beforeEach(() => {
    mockEntityId = "entity-1";
    mockTenantsData = undefined;
    mockIsLoading = false;
    mockIsError = false;
  });

  it("should show no-entity state when no entity selected", () => {
    mockEntityId = null;
    renderWithProviders(<TenantsPage />);
    expect(
      screen.getByText("Aucune entité sélectionnée"),
    ).toBeInTheDocument();
  });

  it("should show empty state when no tenants", () => {
    mockTenantsData = [];
    renderWithProviders(<TenantsPage />);
    expect(screen.getByText("Aucun locataire")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ajouter un locataire/i }),
    ).toHaveAttribute("href", "/tenants/new");
  });

  it("should show loading skeletons", () => {
    mockIsLoading = true;
    const { container } = renderWithProviders(<TenantsPage />);
    // Skeleton elements are present
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should show error state", () => {
    mockIsError = true;
    renderWithProviders(<TenantsPage />);
    expect(
      screen.getByText("Erreur lors du chargement des locataires"),
    ).toBeInTheDocument();
  });

  it("should display tenant cards when tenants exist", () => {
    mockTenantsData = mockTenants;
    renderWithProviders(<TenantsPage />);
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Marie Martin")).toBeInTheDocument();
    expect(screen.getByText("SCI Les Oliviers")).toBeInTheDocument();
    expect(screen.getByText("Particulier")).toBeInTheDocument();
    expect(screen.getByText("Entreprise")).toBeInTheDocument();
  });

  it("should show create button in header", () => {
    mockTenantsData = [];
    renderWithProviders(<TenantsPage />);
    expect(
      screen.getByRole("link", { name: /Nouveau locataire/i }),
    ).toHaveAttribute("href", "/tenants/new");
  });
});
