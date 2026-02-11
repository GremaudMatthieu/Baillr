import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { BankAccountForm } from "../bank-account-form";

describe("BankAccountForm", () => {
  const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with submit and cancel buttons", () => {
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );
    expect(screen.getByRole("button", { name: /Ajouter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annuler/i })).toBeInTheDocument();
  });

  it("should show Libellé field with empty value by default", () => {
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );
    expect(screen.getByPlaceholderText(/Compte courant LCL/i)).toHaveValue("");
  });

  it("should show IBAN and BIC fields for bank_account type", () => {
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );
    // Default type is bank_account — IBAN/BIC fields are visible
    expect(screen.getByPlaceholderText(/FR76/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/CRLYFRPP/)).toBeInTheDocument();
  });

  it("should validate required label", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Ajouter/i }));

    await waitFor(() => {
      expect(screen.getByText(/Le libellé est requis/i)).toBeInTheDocument();
    });
  });

  it("should call onCancel when Annuler is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should disable buttons when isPending", () => {
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={true}
      />,
    );
    expect(screen.getByRole("button", { name: /Ajouter/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Annuler/i })).toBeDisabled();
  });

  it("should show Enregistrer when editing", () => {
    renderWithProviders(
      <BankAccountForm
        account={{
          id: "ba-1",
          entityId: "entity-1",
          type: "bank_account",
          label: "Compte LCL",
          iban: "FR7612345678901234567890123",
          bic: "CRLYFRPP",
          bankName: "LCL",
          isDefault: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Enregistrer/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Compte courant LCL/i)).toHaveValue("Compte LCL");
  });

  it("should hide IBAN, BIC, bankName and isDefault when type is cash_register", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    // Default type shows IBAN/BIC
    expect(screen.getByPlaceholderText(/FR76/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/CRLYFRPP/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Compte par défaut/i)).toBeInTheDocument();

    // Switch to cash_register via the select
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Caisse/ }));

    // IBAN, BIC, bankName and isDefault should be hidden
    expect(screen.queryByPlaceholderText(/FR76/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/CRLYFRPP/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Compte par défaut/i)).not.toBeInTheDocument();
  });

  it("should validate IBAN is required for bank_account type", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BankAccountForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isPending={false}
      />,
    );

    await user.type(screen.getByPlaceholderText(/Compte courant LCL/i), "Test");
    // Leave IBAN empty and submit
    await user.click(screen.getByRole("button", { name: /Ajouter/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/L'IBAN est requis pour un compte bancaire/i),
      ).toBeInTheDocument();
    });
  });
});
