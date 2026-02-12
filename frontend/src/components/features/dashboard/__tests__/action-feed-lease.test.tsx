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

let mockTenantsData = [
  {
    id: "t1",
    firstName: "Jean",
    lastName: "Dupont",
    renewalDate: null,
  },
];

let mockLeasesData: unknown[] | undefined = undefined;

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({ data: mockTenantsData }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: mockLeasesData }),
}));

describe("ActionFeed — lease onboarding step 6", () => {
  beforeEach(() => {
    mockTenantsData = [
      {
        id: "t1",
        firstName: "Jean",
        lastName: "Dupont",
        renewalDate: null,
      },
    ];
    mockLeasesData = undefined;
  });

  it("should show 'Créez vos baux' when tenants exist but no leases", () => {
    mockLeasesData = [];

    renderWithProviders(<ActionFeed />);

    expect(screen.getByText("Créez vos baux")).toBeInTheDocument();
  });

  it("should not show 'Créez vos baux' when leases exist", () => {
    mockLeasesData = [{ id: "l1", unitId: "u1" }];

    renderWithProviders(<ActionFeed />);

    expect(screen.queryByText("Créez vos baux")).not.toBeInTheDocument();
  });
});
