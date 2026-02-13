import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { ImportSummary } from "../import-summary";

describe("ImportSummary", () => {
  it("should render import result summary", () => {
    const result = {
      bankStatementId: "bs-1",
      transactionCount: 5,
      transactions: [
        {
          date: "2026-02-01",
          amountCents: 85000,
          payerName: "Jean Dupont",
          reference: "",
        },
        {
          date: "2026-02-05",
          amountCents: 15000,
          payerName: "Marie Martin",
          reference: "",
        },
        {
          date: "2026-02-10",
          amountCents: -12000,
          payerName: "EDF",
          reference: "",
        },
      ],
    };

    renderWithProviders(<ImportSummary result={result} />);

    expect(screen.getByText("Import réussi")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // transactionCount
  });

  it("should show credit and debit counts", () => {
    const result = {
      bankStatementId: "bs-1",
      transactionCount: 3,
      transactions: [
        {
          date: "2026-02-01",
          amountCents: 85000,
          payerName: "A",
          reference: "",
        },
        {
          date: "2026-02-01",
          amountCents: -5000,
          payerName: "B",
          reference: "",
        },
        {
          date: "2026-02-01",
          amountCents: -3000,
          payerName: "C",
          reference: "",
        },
      ],
    };

    renderWithProviders(<ImportSummary result={result} />);

    // 1 credit, 2 debits
    expect(screen.getByText("Crédits :")).toBeInTheDocument();
    expect(screen.getByText("Débits :")).toBeInTheDocument();
  });

  it("should show duplicate count when duplicates exist", () => {
    const result = {
      bankStatementId: "bs-1",
      transactionCount: 3,
      transactions: [
        {
          date: "2026-02-01",
          amountCents: 85000,
          payerName: "A",
          reference: "LOYER",
          isDuplicate: true,
        },
        {
          date: "2026-02-01",
          amountCents: 85000,
          payerName: "A",
          reference: "LOYER",
          isDuplicate: true,
        },
        {
          date: "2026-02-05",
          amountCents: -5000,
          payerName: "B",
          reference: "",
        },
      ],
    };

    renderWithProviders(<ImportSummary result={result} />);

    expect(screen.getByText("Doublons signalés :")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
