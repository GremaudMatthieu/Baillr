import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";
import type { TenantData } from "@/lib/api/tenants-api";

// Override Date to control "now" without fake timers (which break Promise resolution)
const OriginalDate = globalThis.Date;
let mockNow = new OriginalDate("2026-06-15T12:00:00Z");

function createMockDate() {
  const MockDate = class extends OriginalDate {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(mockNow.getTime());
      } else {
        // @ts-expect-error spread args
        super(...args);
      }
    }
    static override now() {
      return mockNow.getTime();
    }
  } as DateConstructor;
  globalThis.Date = MockDate;
}

const baseTenant: TenantData = {
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
};

let mockTenantsData: TenantData[] | undefined = undefined;

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: "entity-1",
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({ data: [{ id: "ba1" }] }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({ data: [{ id: "p1" }] }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnits: () => ({ data: [{ id: "u1" }] }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({ data: mockTenantsData }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: [] }),
}));

describe("ActionFeed — insurance alerts", () => {
  beforeEach(() => {
    mockTenantsData = undefined;
    mockNow = new OriginalDate("2026-06-15T12:00:00Z");
    createMockDate();
  });

  afterEach(() => {
    globalThis.Date = OriginalDate;
  });

  it("should show no insurance alerts when tenants have no renewalDate", () => {
    mockTenantsData = [baseTenant];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.queryByText(/Assurance de .+ expirée/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Assurance de .+ expire le/),
    ).not.toBeInTheDocument();
  });

  it("should show expired alert when insurance date is in the past", () => {
    mockTenantsData = [
      {
        ...baseTenant,
        insuranceProvider: "MAIF",
        renewalDate: "2026-05-01T00:00:00.000Z",
      },
    ];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.getByText(/Assurance de Jean Dupont expirée depuis le/),
    ).toBeInTheDocument();
  });

  it("should show expiring alert when insurance date is within 30 days", () => {
    mockTenantsData = [
      {
        ...baseTenant,
        insuranceProvider: "AXA",
        renewalDate: "2026-07-01T00:00:00.000Z",
      },
    ];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.getByText(/Assurance de Jean Dupont expire le/),
    ).toBeInTheDocument();
  });

  it("should not show alert when insurance date is more than 30 days away", () => {
    mockTenantsData = [
      {
        ...baseTenant,
        insuranceProvider: "MAIF",
        renewalDate: "2026-12-31T00:00:00.000Z",
      },
    ];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.queryByText(/Assurance de .+ expirée/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Assurance de .+ expire le/),
    ).not.toBeInTheDocument();
  });

  it("should show insurance alerts before onboarding actions", () => {
    mockTenantsData = [
      {
        ...baseTenant,
        insuranceProvider: "MAIF",
        renewalDate: "2026-05-01T00:00:00.000Z",
      },
    ];
    renderWithProviders(<ActionFeed />);
    const items = screen.getAllByRole("listitem");
    // Insurance alert should be first
    expect(items[0].textContent).toContain("Assurance de Jean Dupont expirée");
  });

  it("should link to tenant detail page", () => {
    mockTenantsData = [
      {
        ...baseTenant,
        insuranceProvider: "MAIF",
        renewalDate: "2026-05-01T00:00:00.000Z",
      },
    ];
    renderWithProviders(<ActionFeed />);
    const links = screen.getAllByRole("link", { name: /Commencer/ });
    // First link is the insurance alert
    expect(links[0]).toHaveAttribute("href", "/tenants/t1");
  });
});
