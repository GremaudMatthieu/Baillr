import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ImportBankStatementDialog } from "../import-bank-statement-dialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onConfirm: vi.fn(),
  isPending: false,
  bankAccounts: [
    {
      id: "ba-1",
      entityId: "e-1",
      type: "bank_account" as const,
      label: "Compte courant",
      iban: "FR7612345678901234567890",
      bic: "BNPAFRPP",
      bankName: "BNP",
      isDefault: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "ba-2",
      entityId: "e-1",
      type: "bank_account" as const,
      label: "Livret A",
      iban: null,
      bic: null,
      bankName: null,
      isDefault: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
  ],
  submitError: null,
};

describe("ImportBankStatementDialog", () => {
  it("should render dialog title and description", () => {
    renderWithProviders(<ImportBankStatementDialog {...defaultProps} />);

    expect(
      screen.getByText("Importer un relevé bancaire"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fichier CSV ou Excel/i),
    ).toBeInTheDocument();
  });

  it("should render file drop zone", () => {
    renderWithProviders(<ImportBankStatementDialog {...defaultProps} />);

    expect(
      screen.getByText(/Cliquez pour sélectionner/i),
    ).toBeInTheDocument();
  });

  it("should render bank account selector", () => {
    renderWithProviders(<ImportBankStatementDialog {...defaultProps} />);

    expect(screen.getByText("Compte bancaire")).toBeInTheDocument();
  });

  it("should disable import button when no file or account selected", () => {
    renderWithProviders(<ImportBankStatementDialog {...defaultProps} />);

    const importBtn = screen.getByRole("button", { name: "Importer" });
    expect(importBtn).toBeDisabled();
  });

  it("should show cancel button", () => {
    renderWithProviders(<ImportBankStatementDialog {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeInTheDocument();
  });

  it("should display error message when submitError is set", () => {
    renderWithProviders(
      <ImportBankStatementDialog
        {...defaultProps}
        submitError="Erreur de parsing"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Erreur de parsing");
  });

  it("should show loading state when pending", () => {
    renderWithProviders(
      <ImportBankStatementDialog {...defaultProps} isPending />,
    );

    expect(screen.getByRole("button", { name: /Import/i })).toBeDisabled();
  });

  it("should call onOpenChange when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <ImportBankStatementDialog
        {...defaultProps}
        onOpenChange={onOpenChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onOpenChange).toHaveBeenCalled();
  });
});
