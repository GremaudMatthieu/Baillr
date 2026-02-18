import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { UnitMosaic, buildTooltipContent } from "../unit-mosaic";
import type { UnitWithPropertyData } from "@/lib/api/units-api";
import type { RentCallData } from "@/lib/api/rent-calls-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUnits = [
  {
    id: "u1",
    propertyId: "p1",
    propertyName: "Résidence A",
    userId: "user_1",
    identifier: "Apt 1",
    type: "apartment",
    floor: 1,
    surfaceArea: 45,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "u2",
    propertyId: "p1",
    propertyName: "Résidence A",
    userId: "user_1",
    identifier: "Apt 2",
    type: "apartment",
    floor: 2,
    surfaceArea: 50,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: () => ({
    data: mockUnits,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: [
      { id: "l1", unitId: "u1", endDate: null },
    ],
  }),
}));

let mockRentCallsData: unknown[] = [];

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: mockRentCallsData }),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: [] }),
}));

describe("UnitMosaic — tooltip integration", () => {
  it("should wrap tiles with TooltipTrigger (data-slot attribute)", () => {
    mockRentCallsData = [
      {
        id: "rc1",
        unitId: "u1",
        tenantFirstName: "Jean",
        tenantLastName: "Dupont",
        tenantCompanyName: null,
        tenantType: "individual",
        totalAmountCents: 85000,
        sentAt: "2026-02-10T10:00:00.000Z",
        paidAt: "2026-02-12T14:00:00.000Z",
        paymentStatus: "paid",
        paidAmountCents: 85000,
      },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // Each tile button should be wrapped in a TooltipTrigger
    const tiles = screen.getAllByRole("gridcell");
    for (const tile of tiles) {
      expect(tile.getAttribute("data-slot")).toBe("tooltip-trigger");
    }
  });

  it("should render tooltip trigger on paid tile with correct aria label", () => {
    mockRentCallsData = [
      {
        id: "rc1",
        unitId: "u1",
        tenantFirstName: "Jean",
        tenantLastName: "Dupont",
        tenantCompanyName: null,
        tenantType: "individual",
        totalAmountCents: 85000,
        sentAt: "2026-02-10T10:00:00.000Z",
        paidAt: "2026-02-12T14:00:00.000Z",
        paymentStatus: "paid",
        paidAmountCents: 85000,
      },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const paidTile = screen.getByRole("gridcell", { name: /Apt 1.*payé/ });
    expect(paidTile).toBeInTheDocument();
    expect(paidTile.className).toContain("bg-green-100");
  });

  it("should render tooltip trigger on vacant tile with correct aria label", () => {
    mockRentCallsData = [];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // u2 has no lease → vacant
    const vacantTile = screen.getByRole("gridcell", { name: /Apt 2.*vacant/ });
    expect(vacantTile).toBeInTheDocument();
    expect(vacantTile.className).toContain("bg-muted");
  });

  it("should render tooltip trigger on partial tile with correct aria label", () => {
    mockRentCallsData = [
      {
        id: "rc1",
        unitId: "u1",
        tenantFirstName: "Marie",
        tenantLastName: "Martin",
        tenantCompanyName: null,
        tenantType: "individual",
        totalAmountCents: 80000,
        sentAt: "2026-02-10T10:00:00.000Z",
        paidAt: null,
        paymentStatus: "partial",
        paidAmountCents: 50000,
      },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const partialTile = screen.getByRole("gridcell", { name: /Apt 1.*partiellement payé/ });
    expect(partialTile).toBeInTheDocument();
    expect(partialTile.className).toContain("bg-amber-100");
  });

  it("should render all tiles with tooltip triggers wrapping gridcells", () => {
    mockRentCallsData = [];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // All gridcell elements should have tooltip-trigger data-slot
    const gridcells = screen.getAllByRole("gridcell");
    expect(gridcells).toHaveLength(2);
    for (const cell of gridcells) {
      expect(cell.getAttribute("data-slot")).toBe("tooltip-trigger");
    }
  });
});

describe("buildTooltipContent", () => {
  const baseUnit = { id: "u1" } as UnitWithPropertyData;

  const baseRentCall = {
    tenantFirstName: "Jean",
    tenantLastName: "Dupont",
    tenantCompanyName: null,
    tenantType: "individual",
    totalAmountCents: 85000,
    paidAmountCents: null,
    paymentStatus: null,
  } as unknown as RentCallData;

  it("should show vacant text for vacant status", () => {
    const result = buildTooltipContent(baseUnit, "vacant", new Map());
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain("Vacant");
    expect(container.textContent).toContain("Aucun bail actif");
  });

  it("should show occupied text when no rent call exists", () => {
    const result = buildTooltipContent(baseUnit, "occupied", new Map());
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain("Occupé");
    expect(container.textContent).toContain("Aucun appel de loyer");
  });

  it("should show tenant name and rent amount for paid tile", () => {
    const map = new Map([["u1", { ...baseRentCall, paymentStatus: "paid" as const }]]);
    const result = buildTooltipContent(baseUnit, "paid", map);
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain("Jean Dupont");
    expect(container.textContent).toContain("850,00");
    expect(container.textContent).toContain("payé");
  });

  it("should show company name for company tenant", () => {
    const companyRc = { ...baseRentCall, tenantCompanyName: "ACME SCI", tenantType: "company" };
    const map = new Map([["u1", companyRc as unknown as RentCallData]]);
    const result = buildTooltipContent(baseUnit, "paid", map);
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain("ACME SCI");
    expect(container.textContent).not.toContain("Jean Dupont");
  });

  it("should show paid/total amounts for partial status", () => {
    const partialRc = { ...baseRentCall, paymentStatus: "partial" as const, paidAmountCents: 50000 };
    const map = new Map([["u1", partialRc as unknown as RentCallData]]);
    const result = buildTooltipContent(baseUnit, "partial", map);
    const { container } = render(<>{result}</>);
    expect(container.textContent).toContain("500,00");
    expect(container.textContent).toContain("850,00");
  });
});
