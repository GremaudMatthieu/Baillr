import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { TransactionList } from "../transaction-list";

describe("TransactionList", () => {
  it("should render empty message when no transactions", () => {
    renderWithProviders(<TransactionList transactions={[]} />);

    expect(
      screen.getByText("Aucune transaction à afficher"),
    ).toBeInTheDocument();
  });

  it("should render transaction table with data", () => {
    const transactions = [
      {
        id: "tx-1",
        bankStatementId: "bs-1",
        date: "2026-02-01T00:00:00.000Z",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "LOYER-FEV-2026",
      },
      {
        id: "tx-2",
        bankStatementId: "bs-1",
        date: "2026-02-05T00:00:00.000Z",
        amountCents: -12000,
        payerName: "EDF",
        reference: "ELEC-0205",
      },
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("EDF")).toBeInTheDocument();
    expect(screen.getByText("LOYER-FEV-2026")).toBeInTheDocument();
    expect(screen.getByText("ELEC-0205")).toBeInTheDocument();
  });

  it("should color positive amounts green and negative amounts red", () => {
    const transactions = [
      {
        id: "tx-1",
        date: "2026-02-01T00:00:00.000Z",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "",
      },
      {
        id: "tx-2",
        date: "2026-02-05T00:00:00.000Z",
        amountCents: -12000,
        payerName: "EDF",
        reference: "",
      },
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);

    const cells = screen.getAllByRole("cell");
    // amountCents cells are at index 1 and 5 (4 columns per row)
    const positiveCell = cells[1];
    const negativeCell = cells[5];

    expect(positiveCell.className).toContain("text-green-600");
    expect(negativeCell.className).toContain("text-red-600");
  });

  it("should render without id using index keys (imported transactions)", () => {
    const transactions = [
      {
        date: "2026-02-01T00:00:00.000Z",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "LOYER",
      },
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
  });

  it("should show duplicate badge when isDuplicate is true", () => {
    const transactions = [
      {
        date: "2026-02-01T00:00:00.000Z",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "LOYER",
        isDuplicate: true,
      },
      {
        date: "2026-02-01T00:00:00.000Z",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "LOYER",
        isDuplicate: true,
      },
    ];

    renderWithProviders(<TransactionList transactions={transactions} />);

    const badges = screen.getAllByText("Doublon");
    expect(badges).toHaveLength(2);
  });
});
