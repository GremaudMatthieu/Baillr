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

let mockLeasesData: unknown[] | undefined;
let mockRentCallsData: unknown[] | undefined;

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: mockLeasesData }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: mockRentCallsData }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatuses: () => ({ data: [] }),
}));

describe("ActionFeed — send rent calls step 8", () => {
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

  it("should show step 8 when rent calls exist but none have been sent", () => {
    mockRentCallsData = [
      { id: "rc1", month: "2026-02", sentAt: null },
    ];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Envoyez les appels de loyer par email"),
    ).toBeInTheDocument();
  });

  it("should not show step 8 when all rent calls have been sent", () => {
    mockRentCallsData = [
      { id: "rc1", month: "2026-02", sentAt: "2026-02-10T10:00:00.000Z" },
    ];

    renderWithProviders(<ActionFeed />);

    expect(
      screen.queryByText("Envoyez les appels de loyer par email"),
    ).not.toBeInTheDocument();
  });
});
