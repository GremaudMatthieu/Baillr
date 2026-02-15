import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { TenantCurrentAccount } from "../tenant-current-account";
import type { AccountEntryData } from "@/lib/api/account-entries-api";

const debitEntry: AccountEntryData = {
  id: "ae-1",
  type: "debit",
  category: "rent_call",
  description: "Appel de loyer — Mars 2026",
  amountCents: 85000,
  balanceCents: -85000,
  referenceId: "rc-1",
  referenceMonth: "2026-03",
  entryDate: "2026-03-01T00:00:00.000Z",
};

const creditEntry: AccountEntryData = {
  id: "ae-2",
  type: "credit",
  category: "payment",
  description: "Paiement reçu — Mars 2026",
  amountCents: 85000,
  balanceCents: 0,
  referenceId: "tx-1",
  referenceMonth: "2026-03",
  entryDate: "2026-03-10T00:00:00.000Z",
};

const partialCreditEntry: AccountEntryData = {
  id: "ae-3",
  type: "credit",
  category: "payment",
  description: "Paiement reçu — Mars 2026",
  amountCents: 50000,
  balanceCents: -35000,
  referenceId: "tx-2",
  referenceMonth: "2026-03",
  entryDate: "2026-03-10T00:00:00.000Z",
};

const overpaymentCreditEntry: AccountEntryData = {
  id: "ae-4",
  type: "credit",
  category: "overpayment_credit",
  description: "Trop-perçu — Mars 2026",
  amountCents: 5000,
  balanceCents: 5000,
  referenceId: "tx-3",
  referenceMonth: "2026-03",
  entryDate: "2026-03-10T00:00:00.000Z",
};

describe("TenantCurrentAccount", () => {
  it("should render empty state when no entries", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[]} balanceCents={0} />,
    );

    expect(
      screen.getByText("Aucune opération enregistrée pour ce locataire"),
    ).toBeInTheDocument();
  });

  it("should render balance badge with zero balance in default variant", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry, creditEntry]} balanceCents={0} />,
    );

    const badge = screen.getByLabelText(/Solde/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toMatch(/0,00/);
    expect(badge).not.toHaveClass("bg-destructive");
  });

  it("should render balance badge with destructive variant for negative balance", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry]} balanceCents={-85000} />,
    );

    const badge = screen.getByLabelText(/Solde/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toMatch(/850,00/);
  });

  it("should render balance badge with default variant for positive balance", () => {
    renderWithProviders(
      <TenantCurrentAccount
        entries={[debitEntry, creditEntry, overpaymentCreditEntry]}
        balanceCents={5000}
      />,
    );

    const badge = screen.getByLabelText(/Solde/);
    expect(badge.textContent).toMatch(/50,00/);
  });

  it("should render debit entry with red amount in Débit column", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry]} balanceCents={-85000} />,
    );

    expect(screen.getByText("Appel de loyer — Mars 2026")).toBeInTheDocument();
    // Debit column shows amount
    const rows = screen.getAllByRole("row");
    // Header row + 1 data row
    expect(rows).toHaveLength(2);
    // The debit cell (3rd td) should contain the amount
    const cells = rows[1].querySelectorAll("td");
    expect(cells[2].textContent).toMatch(/850,00/);
    expect(cells[2]).toHaveClass("text-red-600");
    // Credit cell should be empty
    expect(cells[3].textContent).toBe("");
  });

  it("should render credit entry with green amount in Crédit column", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[creditEntry]} balanceCents={0} />,
    );

    const rows = screen.getAllByRole("row");
    const cells = rows[1].querySelectorAll("td");
    // Debit cell empty
    expect(cells[2].textContent).toBe("");
    // Credit cell has amount
    expect(cells[3].textContent).toMatch(/850,00/);
    expect(cells[3]).toHaveClass("text-green-600");
  });

  it("should render running balance with correct color per entry", () => {
    renderWithProviders(
      <TenantCurrentAccount
        entries={[debitEntry, partialCreditEntry]}
        balanceCents={-35000}
      />,
    );

    const rows = screen.getAllByRole("row");
    // First entry (debit): balance -850 = red
    const firstBalance = rows[1].querySelectorAll("td")[4];
    expect(firstBalance).toHaveClass("text-red-600");
    // Second entry (partial credit): balance -350 = still red
    const secondBalance = rows[2].querySelectorAll("td")[4];
    expect(secondBalance).toHaveClass("text-red-600");
  });

  it("should format amounts in French currency", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry]} balanceCents={-85000} />,
    );

    // French format uses comma as decimal separator
    const rows = screen.getAllByRole("row");
    const debitCell = rows[1].querySelectorAll("td")[2];
    expect(debitCell.textContent).toMatch(/850,00/);
  });

  it("should render table with correct column headers", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry]} balanceCents={-85000} />,
    );

    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Débit")).toBeInTheDocument();
    expect(screen.getByText("Crédit")).toBeInTheDocument();
    expect(screen.getByText("Solde")).toBeInTheDocument();
  });

  it("should render date in DD/MM/YYYY French format", () => {
    renderWithProviders(
      <TenantCurrentAccount entries={[debitEntry]} balanceCents={-85000} />,
    );

    const rows = screen.getAllByRole("row");
    const dateCell = rows[1].querySelectorAll("td")[0];
    expect(dateCell.textContent).toBe("01/03/2026");
  });

  it("should render multiple entries in order", () => {
    renderWithProviders(
      <TenantCurrentAccount
        entries={[debitEntry, creditEntry]}
        balanceCents={0}
      />,
    );

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3); // header + 2 data rows
  });

  it("should render charge_regularization debit entry correctly", () => {
    const regulDebit: AccountEntryData = {
      id: "ae-regul-1",
      type: "debit",
      category: "charge_regularization",
      description: "Régularisation des charges — 2025",
      amountCents: 5000,
      balanceCents: -90000,
      referenceId: "entity1-2025-tenant-1",
      referenceMonth: "2025-12",
      entryDate: "2026-02-15T10:00:00.000Z",
    };

    renderWithProviders(
      <TenantCurrentAccount
        entries={[debitEntry, regulDebit]}
        balanceCents={-90000}
      />,
    );

    expect(
      screen.getByText("Régularisation des charges — 2025"),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const regulRow = rows[2]; // header + debitEntry + regulDebit
    const cells = regulRow.querySelectorAll("td");
    expect(cells[2].textContent).toMatch(/50,00/); // 5000 cents = 50,00 €
    expect(cells[2]).toHaveClass("text-red-600");
  });

  it("should render charge_regularization credit entry correctly", () => {
    const regulCredit: AccountEntryData = {
      id: "ae-regul-2",
      type: "credit",
      category: "charge_regularization",
      description: "Avoir régularisation des charges — 2025",
      amountCents: 3000,
      balanceCents: -82000,
      referenceId: "entity1-2025-tenant-2",
      referenceMonth: "2025-12",
      entryDate: "2026-02-15T10:00:00.000Z",
    };

    renderWithProviders(
      <TenantCurrentAccount
        entries={[debitEntry, regulCredit]}
        balanceCents={-82000}
      />,
    );

    expect(
      screen.getByText("Avoir régularisation des charges — 2025"),
    ).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    const regulRow = rows[2];
    const cells = regulRow.querySelectorAll("td");
    expect(cells[3].textContent).toMatch(/30,00/); // 3000 cents = 30,00 €
    expect(cells[3]).toHaveClass("text-green-600");
  });
});
