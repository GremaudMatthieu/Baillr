import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { AccountBookContent } from "../account-book-content";

const mockUseCurrentEntity = vi.fn();
const mockUseAccountBook = vi.fn();
const mockUseTenants = vi.fn();

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => mockUseCurrentEntity(),
}));

vi.mock("@/hooks/use-accounting", () => ({
  useAccountBook: (...args: unknown[]) => mockUseAccountBook(...args),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: (...args: unknown[]) => mockUseTenants(...args),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
}

describe("AccountBookContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenants.mockReturnValue({ data: [] });
  });

  it("should show no-entity state when entityId is not set", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: undefined });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(screen.getByText("Aucune entité sélectionnée")).toBeInTheDocument();
    expect(screen.getByText("Gérer mes entités")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: "entity-1" });
    mockUseAccountBook.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("should show error state", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: "entity-1" });
    mockUseAccountBook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Erreur lors du chargement du livre de comptes."),
    ).toBeInTheDocument();
  });

  it("should show empty state when no entries", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: "entity-1" });
    mockUseAccountBook.mockReturnValue({
      data: { entries: [], totalBalanceCents: 0, availableCategories: [] },
      isLoading: false,
      isError: false,
    });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(
      screen.getByText("Aucune écriture comptable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Les écritures apparaîtront automatiquement lorsque vous générerez des appels de loyer et enregistrerez des paiements.",
      ),
    ).toBeInTheDocument();
  });

  it("should render table when entries exist", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: "entity-1" });
    mockUseAccountBook.mockReturnValue({
      data: {
        entries: [
          {
            id: "ae-1",
            entityId: "entity-1",
            tenantId: "t-1",
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
        ],
        totalBalanceCents: 80000,
        availableCategories: ["rent_call"],
      },
      isLoading: false,
      isError: false,
    });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(
      screen.getAllByText("Appel de loyer - 2026-01").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Solde total")).toBeInTheDocument();
  });

  it("should display the page title", () => {
    mockUseCurrentEntity.mockReturnValue({ entityId: "entity-1" });
    mockUseAccountBook.mockReturnValue({
      data: { entries: [], totalBalanceCents: 0, availableCategories: [] },
      isLoading: false,
      isError: false,
    });

    render(<AccountBookContent />, { wrapper: createWrapper() });

    expect(screen.getByText("Livre de comptes")).toBeInTheDocument();
  });
});
