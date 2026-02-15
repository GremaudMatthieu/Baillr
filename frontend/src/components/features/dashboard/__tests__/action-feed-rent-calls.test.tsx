import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";

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
  useTenants: () => ({
    data: [
      { id: "t1", firstName: "Jean", lastName: "Dupont", renewalDate: null },
    ],
  }),
}));

let mockLeasesData: unknown[] | undefined = [
  {
    id: "l1",
    unitId: "u1",
    tenantId: "t1",
    rentAmountCents: 80000,
    startDate: "2026-01-01",
    endDate: null,
  },
];

let mockRentCallsData: unknown[] | undefined = undefined;

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: mockLeasesData }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: mockRentCallsData }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatuses: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-charge-regularization", () => ({
  useChargeRegularizations: () => ({ data: [] }),
}));

describe("ActionFeed — rent calls onboarding step 7", () => {
  beforeEach(() => {
    mockLeasesData = [
      {
        id: "l1",
        unitId: "u1",
        tenantId: "t1",
        rentAmountCents: 80000,
        startDate: "2026-01-01",
        endDate: null,
      },
    ];
    mockRentCallsData = undefined;
  });

  it("should show 'Générez vos appels de loyer' when active leases exist and no rent calls", () => {
    mockRentCallsData = [];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Générez vos appels de loyer"),
    ).toBeInTheDocument();
  });

  it("should not show rent call step when rent calls already generated", () => {
    mockRentCallsData = [{ id: "rc1", month: "2026-03" }];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText("Générez vos appels de loyer"),
    ).not.toBeInTheDocument();
  });

  it("should not show rent call step when no active leases", () => {
    mockLeasesData = [];
    mockRentCallsData = [];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText("Générez vos appels de loyer"),
    ).not.toBeInTheDocument();
  });

  it("should not show rent call step when all leases are terminated", () => {
    mockLeasesData = [
      {
        id: "l1",
        unitId: "u1",
        tenantId: "t1",
        rentAmountCents: 80000,
        startDate: "2025-01-01",
        endDate: "2025-12-31T00:00:00.000Z",
      },
    ];
    mockRentCallsData = [];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText("Générez vos appels de loyer"),
    ).not.toBeInTheDocument();
  });
});
