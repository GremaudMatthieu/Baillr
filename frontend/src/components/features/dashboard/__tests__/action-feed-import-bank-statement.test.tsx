import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ActionFeed } from "../action-feed";

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: "entity-1",
    entity: { id: "entity-1", name: "SCI Test" },
    entities: [{ id: "entity-1", name: "SCI Test" }],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({
    data: [{ id: "ba-1", label: "Compte courant" }],
  }),
}));

vi.mock("@/hooks/use-properties", () => ({
  useProperties: () => ({
    data: [{ id: "p-1", name: "Résidence A" }],
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnits: () => ({
    data: [{ id: "u-1", identifier: "Appt A1" }],
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({
    data: [
      {
        id: "t-1",
        firstName: "Jean",
        lastName: "Dupont",
        renewalDate: null,
      },
    ],
  }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: [
      {
        id: "l-1",
        tenantId: "t-1",
        unitId: "u-1",
        rentAmountCents: 80000,
        startDate: "2026-01-01",
        endDate: null,
      },
    ],
  }),
}));

// All rent calls for current month are SENT (sentAt is set)
vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({
    data: [
      {
        id: "rc-1",
        entityId: "entity-1",
        month: "2026-02",
        totalAmountCents: 80000,
        sentAt: "2026-02-10T10:00:00Z",
        recipientEmail: "jean@example.com",
      },
    ],
  }),
}));

// No bank statements imported yet
vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatuses: () => ({ data: [] }),
}));

describe("ActionFeed — step 9 import bank statement", () => {
  it("should show import bank statement action when rent calls sent and no statements", () => {
    renderWithProviders(<ActionFeed />);

    expect(
      screen.getByText("Importez votre relevé bancaire"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/relevé CSV ou Excel/i),
    ).toBeInTheDocument();
  });

  it("should link to /payments", () => {
    renderWithProviders(<ActionFeed />);

    const links = screen.getAllByRole("link", { name: /Commencer/i });
    const importLink = links.find(
      (link) => link.getAttribute("href") === "/payments",
    );
    expect(importLink).toBeDefined();
  });
});
