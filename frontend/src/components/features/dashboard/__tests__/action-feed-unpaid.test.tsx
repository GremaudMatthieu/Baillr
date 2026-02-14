import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";
import type { UnpaidRentCallData } from "@/lib/api/rent-calls-api";

let mockUnpaidData: UnpaidRentCallData[] = [];

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
  useTenants: () => ({ data: [{ id: "t1", firstName: "Jean", lastName: "Dupont" }] }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: mockUnpaidData }),
}));

describe("ActionFeed — unpaid alerts", () => {
  it("should show no unpaid alerts when no unpaid rent calls", () => {
    mockUnpaidData = [];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.queryByText(/Loyer impayé/),
    ).not.toBeInTheDocument();
  });

  it("should show unpaid alert with tenant name, amount and days late", () => {
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
    ];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.getByText(/Loyer impayé — Jean Dupont/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/36 jours de retard/),
    ).toBeInTheDocument();
  });

  it("should show company name for company tenants", () => {
    mockUnpaidData = [
      {
        id: "rc-2",
        entityId: "entity-1",
        leaseId: "lease-2",
        tenantId: "t2",
        unitId: "u2",
        month: "2026-01",
        totalAmountCents: 120000,
        paidAmountCents: null,
        remainingBalanceCents: null,
        paymentStatus: null,
        sentAt: "2026-01-01T00:00:00Z",
        tenantFirstName: "Marie",
        tenantLastName: "Martin",
        tenantCompanyName: "SARL Martin",
        tenantType: "company",
        unitIdentifier: "Commerce 1",
        dueDate: "2026-01-05T00:00:00Z",
        daysLate: 10,
      },
    ];
    renderWithProviders(<ActionFeed />);
    expect(
      screen.getByText(/Loyer impayé — SARL Martin/),
    ).toBeInTheDocument();
  });

  it("should show remaining balance for partial payments", () => {
    mockUnpaidData = [
      {
        id: "rc-3",
        entityId: "entity-1",
        leaseId: "lease-1",
        tenantId: "t1",
        unitId: "u1",
        month: "2026-01",
        totalAmountCents: 80000,
        paidAmountCents: 50000,
        remainingBalanceCents: 30000,
        paymentStatus: "partial",
        sentAt: "2026-01-01T00:00:00Z",
        tenantFirstName: "Jean",
        tenantLastName: "Dupont",
        tenantCompanyName: null,
        tenantType: "individual",
        unitIdentifier: "Apt 101",
        dueDate: "2026-01-05T00:00:00Z",
        daysLate: 20,
      },
    ];
    renderWithProviders(<ActionFeed />);
    // Should show remaining balance (300 EUR) not total (800 EUR)
    expect(
      screen.getByText(/Loyer impayé — Jean Dupont — 300/),
    ).toBeInTheDocument();
  });

  it("should render unpaid alerts before insurance and onboarding actions", () => {
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
    ];
    renderWithProviders(<ActionFeed />);
    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("Loyer impayé");
  });

  it("should show Urgent priority label", () => {
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
    ];
    renderWithProviders(<ActionFeed />);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("should link to unpaid filter view", () => {
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
    ];
    renderWithProviders(<ActionFeed />);
    const links = screen.getAllByRole("link", { name: /Commencer/ });
    expect(links[0]).toHaveAttribute("href", "/rent-calls?filter=unpaid");
  });
});
