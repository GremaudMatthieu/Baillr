import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { BankAccountList } from "../bank-account-list";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";

const mockAccounts: BankAccountData[] = [
  {
    id: "ba-1",
    entityId: "entity-1",
    type: "bank_account",
    label: "Compte courant",
    iban: "FR7612345678901234567890123",
    bic: "BNPAFRPP",
    bankName: "BNP Paribas",
    isDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockUseBankAccounts = vi.fn();

vi.mock("@/hooks/use-bank-accounts", () => ({
  useBankAccounts: (...args: unknown[]) => mockUseBankAccounts(...args),
  useAddBankAccount: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateBankAccount: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useRemoveBankAccount: () => ({ isPending: false, mutate: vi.fn() }),
}));

describe("BankAccountList", () => {
  it("should display loading state", () => {
    mockUseBankAccounts.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("should display error state", () => {
    mockUseBankAccounts.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("fail"),
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(
      screen.getByText("Erreur lors du chargement des comptes bancaires"),
    ).toBeInTheDocument();
  });

  it("should display empty state", () => {
    mockUseBankAccounts.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(
      screen.getByText("Aucun compte bancaire configuré"),
    ).toBeInTheDocument();
  });

  it("should render account cards when data is available", () => {
    mockUseBankAccounts.mockReturnValue({
      data: mockAccounts,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(screen.getByText("Compte courant")).toBeInTheDocument();
    expect(screen.getByText("1 compte")).toBeInTheDocument();
  });

  it("should show plural count for multiple accounts", () => {
    mockUseBankAccounts.mockReturnValue({
      data: [...mockAccounts, { ...mockAccounts[0], id: "ba-2", label: "Caisse" }],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(screen.getByText("2 comptes")).toBeInTheDocument();
  });

  it("should show form when Ajouter un compte is clicked", async () => {
    const user = userEvent.setup();
    mockUseBankAccounts.mockReturnValue({
      data: mockAccounts,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    await user.click(
      screen.getByRole("button", { name: /Ajouter un compte/i }),
    );

    expect(screen.getByText("Ajouter un compte")).toBeInTheDocument();
    expect(screen.getByLabelText(/Libellé/i)).toBeInTheDocument();
  });

  it("should show delete confirmation dialog and confirm removal", async () => {
    const user = userEvent.setup();
    mockUseBankAccounts.mockReturnValue({
      data: mockAccounts,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);

    // Click the remove button on the card
    await user.click(
      screen.getByRole("button", { name: /Supprimer Compte courant/i }),
    );

    // AlertDialog should appear
    expect(
      screen.getByText(/Voulez-vous vraiment supprimer le compte/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Supprimer/i }),
    ).toBeInTheDocument();

    // Confirm deletion
    await user.click(
      screen.getByRole("button", { name: /Supprimer/i }),
    );

    // Dialog should close (confirm text gone)
    expect(
      screen.queryByText(/Voulez-vous vraiment supprimer le compte/i),
    ).not.toBeInTheDocument();
  });

  it("should render list with accessible label", () => {
    mockUseBankAccounts.mockReturnValue({
      data: mockAccounts,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<BankAccountList entityId="entity-1" />);
    expect(
      screen.getByRole("list", { name: "Comptes bancaires" }),
    ).toBeInTheDocument();
  });
});
