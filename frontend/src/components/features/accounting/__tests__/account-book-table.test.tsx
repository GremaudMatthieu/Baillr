import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AccountBookTable } from "../account-book-table";
import type { AccountEntryWithTenant } from "@/lib/api/accounting-api";

const mockEntries: AccountEntryWithTenant[] = [
  {
    id: "ae-1",
    entityId: "entity-1",
    tenantId: "tenant-1",
    type: "debit",
    category: "rent_call",
    description: "Appel de loyer - 2026-01",
    amountCents: 80000,
    balanceCents: 80000,
    referenceId: "rc-1",
    referenceMonth: "2026-01",
    entryDate: "2026-01-05T00:00:00Z",
    createdAt: "2026-01-05T00:00:00Z",
    tenant: {
      firstName: "Jean",
      lastName: "Dupont",
      companyName: null,
      type: "individual",
    },
  },
  {
    id: "ae-2",
    entityId: "entity-1",
    tenantId: "tenant-1",
    type: "credit",
    category: "payment",
    description: "Paiement reçu - 2026-01",
    amountCents: 80000,
    balanceCents: 0,
    referenceId: "pay-1",
    referenceMonth: "2026-01",
    entryDate: "2026-01-10T00:00:00Z",
    createdAt: "2026-01-10T00:00:00Z",
    tenant: {
      firstName: "Jean",
      lastName: "Dupont",
      companyName: null,
      type: "individual",
    },
  },
  {
    id: "ae-3",
    entityId: "entity-1",
    tenantId: "tenant-2",
    type: "debit",
    category: "rent_call",
    description: "Appel de loyer - 2026-01",
    amountCents: 60000,
    balanceCents: -60000,
    referenceId: "rc-2",
    referenceMonth: "2026-01",
    entryDate: "2026-01-05T00:00:00Z",
    createdAt: "2026-01-05T00:00:00Z",
    tenant: {
      firstName: "",
      lastName: "",
      companyName: "SCI Martin",
      type: "company",
    },
  },
];

describe("AccountBookTable", () => {
  it("should render table headers", () => {
    render(<AccountBookTable entries={mockEntries} />);

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Débit")).toBeInTheDocument();
    expect(screen.getByText("Crédit")).toBeInTheDocument();
    expect(screen.getByText("Solde")).toBeInTheDocument();
  });

  it("should render entries with description", () => {
    render(<AccountBookTable entries={mockEntries} />);

    expect(
      screen.getAllByText("Appel de loyer - 2026-01").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText("Paiement reçu - 2026-01").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("should display category badges", () => {
    render(<AccountBookTable entries={mockEntries} />);

    expect(
      screen.getAllByText("Appel de loyer").length,
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getAllByText("Paiement").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("should display tenant names", () => {
    render(<AccountBookTable entries={mockEntries} />);

    expect(
      screen.getAllByText("Jean Dupont").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText("SCI Martin").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("should display amounts with French formatting", () => {
    render(<AccountBookTable entries={mockEntries} />);

    // 80000 cents = 800,00 €
    const amounts = screen.getAllByText(/800,00/);
    expect(amounts.length).toBeGreaterThanOrEqual(1);
  });

  it("should display negative balance in red", () => {
    render(<AccountBookTable entries={mockEntries} />);

    // Entry ae-3 has balanceCents = -60000
    const negativeBalances = screen.getAllByText(/600,00/);
    const redBalance = negativeBalances.find((el) =>
      el.className.includes("text-red-600"),
    );
    expect(redBalance).toBeDefined();
  });

  it("should render mobile card layout", () => {
    render(<AccountBookTable entries={mockEntries} />);

    // Mobile layout should have "Solde :" prefix
    const mobileBalances = screen.getAllByText(/Solde :/);
    expect(mobileBalances.length).toBe(3);
  });
});
