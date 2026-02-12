import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import LeasesPage from "../page";
import type { LeaseData } from "@/lib/api/leases-api";
import type { TenantData } from "@/lib/api/tenants-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/leases",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockLeases: LeaseData[] = [
  {
    id: "l1",
    entityId: "entity-1",
    userId: "user_test",
    tenantId: "t1",
    unitId: "u1",
    startDate: "2026-03-01T00:00:00.000Z",
    rentAmountCents: 63000,
    securityDepositCents: 63000,
    monthlyDueDate: 5,
    revisionIndexType: "IRL",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "l2",
    entityId: "entity-1",
    userId: "user_test",
    tenantId: "t2",
    unitId: "u2",
    startDate: "2026-06-01T00:00:00.000Z",
    rentAmountCents: 45000,
    securityDepositCents: 45000,
    monthlyDueDate: 1,
    revisionIndexType: "ILC",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

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
    insuranceProvider: null,
    policyNumber: null,
    renewalDate: null,
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
  },
];

let mockEntityId: string | null = "entity-1";
let mockLeasesData: LeaseData[] | undefined = undefined;
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

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: mockLeasesData,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({
    data: mockTenantsData,
    isLoading: false,
    isError: false,
  }),
}));

describe("LeasesPage", () => {
  beforeEach(() => {
    mockEntityId = "entity-1";
    mockLeasesData = undefined;
    mockTenantsData = undefined;
    mockIsLoading = false;
    mockIsError = false;
  });

  it("should show no-entity state when no entity selected", () => {
    mockEntityId = null;
    renderWithProviders(<LeasesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Baux" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aucune entité sélectionnée")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Gérer mes entités/i }),
    ).toHaveAttribute("href", "/entities");
  });

  it("should show empty state when no leases", () => {
    mockLeasesData = [];
    renderWithProviders(<LeasesPage />);

    expect(screen.getByText("Aucun bail")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Créer un bail/i }),
    ).toHaveAttribute("href", "/leases/new");
  });

  it("should show loading skeletons", () => {
    mockIsLoading = true;
    const { container } = renderWithProviders(<LeasesPage />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should show error state", () => {
    mockIsError = true;
    renderWithProviders(<LeasesPage />);

    expect(
      screen.getByText("Erreur lors du chargement des baux"),
    ).toBeInTheDocument();
  });

  it("should display lease cards with tenant names when leases exist", () => {
    mockLeasesData = mockLeases;
    mockTenantsData = mockTenants;
    renderWithProviders(<LeasesPage />);

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Marie Martin")).toBeInTheDocument();
    expect(screen.getByText("IRL")).toBeInTheDocument();
    expect(screen.getByText("ILC")).toBeInTheDocument();
  });

  it("should show create button in header when entity selected", () => {
    mockLeasesData = [];
    renderWithProviders(<LeasesPage />);

    expect(
      screen.getByRole("link", { name: /Nouveau bail/i }),
    ).toHaveAttribute("href", "/leases/new");
  });

  it("should show 'Locataire inconnu' when tenant data not loaded", () => {
    mockLeasesData = mockLeases;
    mockTenantsData = undefined;
    renderWithProviders(<LeasesPage />);

    const unknownTenants = screen.getAllByText("Locataire inconnu");
    expect(unknownTenants).toHaveLength(2);
  });
});
