import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { PaymentsPageContent } from "../payments-page-content";

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({ data: [], isLoading: false }),
  useBankTransactions: () => ({ data: [] }),
  useImportBankStatement: () => ({
    importStatement: vi.fn(),
    isPending: false,
    error: null,
  }),
  useMatchPayments: () => ({
    matchPayments: vi.fn(),
    isPending: false,
    error: null,
    result: null,
  }),
}));

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: () => ({
    data: [{ id: "ba-1", label: "Compte courant", iban: "FR76123456789" }],
  }),
}));

vi.mock("@/hooks/use-bank-connections", () => ({
  useBankConnections: () => ({ data: [] }),
  useSyncBankConnection: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-payment-actions", () => ({
  usePaymentActions: () => ({
    handleValidate: vi.fn(),
    handleReject: vi.fn(),
    handleAssign: vi.fn(),
    getRowStatus: vi.fn().mockReturnValue("default"),
    progress: { validated: 0, rejected: 0, assigned: 0 },
    error: null,
  }),
}));

describe("PaymentsPageContent", () => {
  it("should render page title", () => {
    renderWithProviders(<PaymentsPageContent entityId="entity-1" />);

    expect(screen.getByText("Paiements")).toBeInTheDocument();
  });

  it("should render import buttons", () => {
    renderWithProviders(<PaymentsPageContent entityId="entity-1" />);

    const importButtons = screen.getAllByRole("button", {
      name: /Importer un relevé/i,
    });
    expect(importButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render empty state when no statements", () => {
    renderWithProviders(<PaymentsPageContent entityId="entity-1" />);

    expect(
      screen.getByText("Aucun relevé bancaire importé"),
    ).toBeInTheDocument();
  });

  it("should not show sync button when no active connections", () => {
    renderWithProviders(<PaymentsPageContent entityId="entity-1" />);

    expect(
      screen.queryByRole("button", { name: /Synchroniser ma banque/i }),
    ).not.toBeInTheDocument();
  });

  it("should show import-only empty state text when no connections", () => {
    renderWithProviders(<PaymentsPageContent entityId="entity-1" />);

    expect(
      screen.getByText(/Importez votre premier relevé bancaire/),
    ).toBeInTheDocument();
  });
});
