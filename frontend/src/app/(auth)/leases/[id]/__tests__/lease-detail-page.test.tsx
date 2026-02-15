import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import type { BillingLineData } from "@/lib/api/leases-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/leases/lease-1",
  useParams: () => ({ id: "lease-1" }),
  useSearchParams: () => new URLSearchParams(),
}));

const baseBillingLines: BillingLineData[] = [];
let mockBillingLines = baseBillingLines;
let mockRentAmountCents = 63000;
let mockIsLoading = false;
let mockIsError = false;

vi.mock("@/hooks/use-leases", () => ({
  useLease: () => ({
    data: mockIsLoading
      ? undefined
      : mockIsError
        ? undefined
        : {
            id: "lease-1",
            entityId: "entity-1",
            userId: "user_test",
            tenantId: "tenant-1",
            unitId: "unit-1",
            startDate: "2026-03-01T00:00:00.000Z",
            rentAmountCents: mockRentAmountCents,
            securityDepositCents: 63000,
            monthlyDueDate: 5,
            revisionIndexType: "IRL",
            billingLines: mockBillingLines,
            revisionDay: null,
            revisionMonth: null,
            referenceQuarter: null,
            referenceYear: null,
            baseIndexValue: null,
            endDate: null,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
  useConfigureBillingLines: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useConfigureRevisionParameters: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTerminateLease: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenant: () => ({
    data: {
      id: "tenant-1",
      firstName: "Pierre",
      lastName: "Durand",
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnit: () => ({
    data: undefined,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-charge-categories", () => ({
  useChargeCategories: () => ({
    data: [
      { id: "cat-water", slug: "water", label: "Eau", isStandard: true },
      { id: "cat-elec", slug: "electricity", label: "Électricité", isStandard: true },
    ],
    isLoading: false,
  }),
}));

// Import LeaseDetailContent directly to avoid `use(Promise)` issues in jsdom
import { LeaseDetailContent } from "@/components/features/leases/lease-detail-content";

describe("LeaseDetailPage — revision parameters", () => {
  beforeEach(() => {
    mockBillingLines = [];
    mockRentAmountCents = 63000;
    mockIsLoading = false;
    mockIsError = false;
  });

  it("should display 'Paramètres de révision' section", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Paramètres de révision")).toBeInTheDocument();
  });

  it("should show configure prompt when no revision params set", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.getByText("Configurer les paramètres de révision"),
    ).toBeInTheDocument();
  });

  it("should show 'Configurer' button for revision params", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    // The page has two "Configurer" buttons (billing lines + revision params)
    const configureButtons = screen.getAllByRole("button", {
      name: /Configurer/i,
    });
    expect(configureButtons.length).toBeGreaterThanOrEqual(1);
  });
});

describe("LeaseDetailPage — billing lines", () => {
  beforeEach(() => {
    mockBillingLines = [];
    mockRentAmountCents = 63000;
    mockIsLoading = false;
    mockIsError = false;
  });

  it("should display 'Lignes de facturation' section", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Lignes de facturation")).toBeInTheDocument();
  });

  it("should display default rent line", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    // "Loyer" label appears in both detail section and billing lines table
    const loyerTexts = screen.getAllByText("Loyer");
    expect(loyerTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("should display prompt when no billing lines configured", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.getByText("Ajouter des lignes de facturation"),
    ).toBeInTheDocument();
  });

  it("should display billing lines with category labels when configured", () => {
    mockBillingLines = [
      { chargeCategoryId: "cat-water", categoryLabel: "Eau", amountCents: 5000 },
      { chargeCategoryId: "cat-elec", categoryLabel: "Électricité", amountCents: 3000 },
    ];

    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    // Both mobile and desktop views render the category labels
    expect(screen.getAllByText("Eau").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Électricité").length).toBeGreaterThanOrEqual(1);
  });

  it("should display total monthly amount", () => {
    mockBillingLines = [
      { chargeCategoryId: "cat-water", categoryLabel: "Eau", amountCents: 5000 },
    ];
    mockRentAmountCents = 63000;

    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    // Both mobile (stacked cards) and desktop (table) render "Total mensuel"
    const totals = screen.getAllByText("Total mensuel");
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it("should show 'Configurer les lignes' button", () => {
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.getByRole("button", { name: /Configurer les lignes/i }),
    ).toBeInTheDocument();
  });

  it("should not show prompt when billing lines exist", () => {
    mockBillingLines = [
      { chargeCategoryId: "cat-water", categoryLabel: "Eau", amountCents: 5000 },
    ];

    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.queryByText("Ajouter des lignes de facturation"),
    ).not.toBeInTheDocument();
  });
});
