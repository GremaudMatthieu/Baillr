import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { BankAccountCard } from "../bank-account-card";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";

const bankAccount: BankAccountData = {
  id: "ba-1",
  entityId: "entity-1",
  type: "bank_account",
  label: "Compte courant LCL",
  iban: "FR7612345678901234567890123",
  bic: "CRLYFRPP",
  bankName: "LCL",
  isDefault: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const cashRegister: BankAccountData = {
  id: "ba-2",
  entityId: "entity-1",
  type: "cash_register",
  label: "Caisse principale",
  iban: null,
  bic: null,
  bankName: null,
  isDefault: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("BankAccountCard", () => {
  it("should render account label", () => {
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Compte courant LCL")).toBeInTheDocument();
  });

  it("should display Par défaut badge when isDefault", () => {
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Par défaut")).toBeInTheDocument();
  });

  it("should not display Par défaut badge when not default", () => {
    renderWithProviders(
      <BankAccountCard
        account={cashRegister}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByText("Par défaut")).not.toBeInTheDocument();
  });

  it("should display bank name and type in description", () => {
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // Description combines type label and bank name: "Compte bancaire — LCL"
    expect(
      screen.getByText((content) =>
        content.includes("Compte bancaire") && content.includes("LCL"),
      ),
    ).toBeInTheDocument();
  });

  it("should display type label for cash register", () => {
    renderWithProviders(
      <BankAccountCard
        account={cashRegister}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // CardDescription renders the type label "Caisse" (from typeLabels map)
    // The label "Caisse principale" is in CardTitle, the type "Caisse" in CardDescription
    const descriptions = screen.getAllByText(/Caisse/);
    // At least one should be in a description element (not the title)
    expect(descriptions.length).toBeGreaterThanOrEqual(2);
  });

  it("should display masked IBAN when present", () => {
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // The masked IBAN is in a <p> with font-mono class
    const ibanElement = screen.getByText((_content, element) => {
      if (element?.tagName !== "P") return false;
      const text = element?.textContent ?? "";
      return text.includes("FR") && text.includes("*");
    });
    expect(ibanElement).toBeInTheDocument();
  });

  it("should not display IBAN when null", () => {
    renderWithProviders(
      <BankAccountCard
        account={cashRegister}
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    // No font-mono element for IBAN
    expect(screen.queryByText(/FR/)).not.toBeInTheDocument();
  });

  it("should call onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={onEdit}
        onRemove={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Modifier Compte courant LCL/i }),
    );
    expect(onEdit).toHaveBeenCalledWith(bankAccount);
  });

  it("should call onRemove when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithProviders(
      <BankAccountCard
        account={bankAccount}
        onEdit={vi.fn()}
        onRemove={onRemove}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Supprimer Compte courant LCL/i }),
    );
    expect(onRemove).toHaveBeenCalledWith("ba-1");
  });
});
