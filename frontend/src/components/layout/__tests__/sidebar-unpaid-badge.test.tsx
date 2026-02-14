import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Sidebar } from "../sidebar";
import type { UnpaidRentCallData } from "@/lib/api/rent-calls-api";

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

vi.mock("@/contexts/entity-context", () => ({
  useEntityContext: () => ({
    currentEntityId: "entity-1",
    setCurrentEntityId: vi.fn(),
    currentEntity: {
      id: "entity-1",
      name: "SCI Alpha",
      type: "sci",
    },
    entities: [
      {
        id: "entity-1",
        name: "SCI Alpha",
        type: "sci",
      },
    ],
    isLoading: false,
  }),
}));

let mockUnpaidData: UnpaidRentCallData[] = [];

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: mockUnpaidData }),
}));

describe("Sidebar — unpaid badge", () => {
  it("should not show badge when no unpaid rent calls", () => {
    mockUnpaidData = [];
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    const rentCallLinks = screen.getAllByText("Appels de loyer");
    for (const el of rentCallLinks) {
      const link = el.closest("a");
      expect(link?.textContent).not.toMatch(/\d+/);
    }
  });

  it("should show destructive badge with count when unpaid rent calls exist", () => {
    mockUnpaidData = [
      {
        id: "rc-1",
        entityId: "entity-1",
        leaseId: "lease-1",
        tenantId: "t1",
        unitId: "u1",
        month: "2026-01",
        totalAmountCents: 80000,
        paidAmountCents: null,
        remainingBalanceCents: null,
        paymentStatus: null,
        sentAt: "2026-01-01T00:00:00Z",
        tenantFirstName: "Jean",
        tenantLastName: "Dupont",
        tenantCompanyName: null,
        tenantType: "individual",
        unitIdentifier: "Apt 101",
        dueDate: "2026-01-05T00:00:00Z",
        daysLate: 36,
      },
      {
        id: "rc-2",
        entityId: "entity-1",
        leaseId: "lease-2",
        tenantId: "t2",
        unitId: "u2",
        month: "2026-01",
        totalAmountCents: 60000,
        paidAmountCents: null,
        remainingBalanceCents: null,
        paymentStatus: null,
        sentAt: "2026-01-01T00:00:00Z",
        tenantFirstName: "Marie",
        tenantLastName: "Martin",
        tenantCompanyName: null,
        tenantType: "individual",
        unitIdentifier: "Apt 102",
        dueDate: "2026-01-05T00:00:00Z",
        daysLate: 20,
      },
    ];
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    // Badge should show count 2 (desktop sidebar — not collapsed)
    const badges = screen.getAllByText("2");
    expect(badges.length).toBeGreaterThan(0);
  });
});
