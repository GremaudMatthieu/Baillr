import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { RecordManualPaymentDialog } from "../record-manual-payment-dialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onConfirm: vi.fn(),
  isPending: false,
  defaultPayerName: "Jean Dupont",
  defaultAmountCents: 85000,
};

describe("RecordManualPaymentDialog", () => {
  it("should render dialog title and description", () => {
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    expect(
      screen.getByText("Enregistrer un paiement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/paiement reçu en espèces ou par chèque/),
    ).toBeInTheDocument();
  });

  it("should pre-fill amount from defaultAmountCents", () => {
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    const amountInput = screen.getByLabelText("Montant (€)");
    expect(amountInput).toHaveValue(850);
  });

  it("should pre-fill payer name from defaultPayerName", () => {
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    const payerInput = screen.getByLabelText("Nom du payeur");
    expect(payerInput).toHaveValue("Jean Dupont");
  });

  it("should pre-fill payment date with today", () => {
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    const dateInput = screen.getByLabelText("Date du paiement");
    const today = new Date().toISOString().split("T")[0];
    expect(dateInput).toHaveValue(today);
  });

  it("should not show check reference field by default (cash mode)", () => {
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    expect(screen.queryByLabelText("N° de chèque")).not.toBeInTheDocument();
  });

  it("should show check reference field when check payment selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecordManualPaymentDialog {...defaultProps} />);

    // Open payment method select and choose "Chèque"
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    const option = screen.getByRole("option", { name: "Chèque" });
    await user.click(option);

    expect(screen.getByLabelText("N° de chèque")).toBeInTheDocument();
  });

  it("should call onConfirm with correct data for cash payment", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    // Click Enregistrer
    await user.click(
      screen.getByRole("button", { name: "Enregistrer" }),
    );

    expect(onConfirm).toHaveBeenCalledWith({
      amountCents: 85000,
      paymentMethod: "cash",
      paymentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      payerName: "Jean Dupont",
    });
  });

  it("should call onConfirm with check reference for check payment", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    // Switch to check
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Chèque" }));

    // Fill check reference
    const refInput = screen.getByLabelText("N° de chèque");
    await user.type(refInput, "CHK-999");

    // Submit
    await user.click(
      screen.getByRole("button", { name: "Enregistrer" }),
    );

    expect(onConfirm).toHaveBeenCalledWith({
      amountCents: 85000,
      paymentMethod: "check",
      paymentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      payerName: "Jean Dupont",
      paymentReference: "CHK-999",
    });
  });

  it("should disable submit when amount is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecordManualPaymentDialog
        {...defaultProps}
        defaultAmountCents={0}
        defaultPayerName="Jean Dupont"
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Enregistrer" });
    expect(submitBtn).toBeDisabled();
  });

  it("should disable submit when payer name is empty", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecordManualPaymentDialog
        {...defaultProps}
        defaultPayerName=""
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "Enregistrer" });
    expect(submitBtn).toBeDisabled();
  });

  it("should show loading state when isPending", () => {
    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} isPending={true} />,
    );

    expect(
      screen.getByRole("button", { name: /Enregistrement/ }),
    ).toBeDisabled();
  });

  it("should disable cancel button when isPending", () => {
    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} isPending={true} />,
    );

    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeDisabled();
  });

  it("should display error message when error is provided", () => {
    renderWithProviders(
      <RecordManualPaymentDialog
        {...defaultProps}
        error="Erreur serveur"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Erreur serveur");
  });

  it("should not display error when error is null", () => {
    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} error={null} />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should not render when not open", () => {
    renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} open={false} />,
    );

    expect(
      screen.queryByText("Enregistrer un paiement"),
    ).not.toBeInTheDocument();
  });

  it("should sync state when defaults change while re-opening", () => {
    const { rerender } = renderWithProviders(
      <RecordManualPaymentDialog {...defaultProps} />,
    );

    // Verify initial values
    expect(screen.getByLabelText("Nom du payeur")).toHaveValue("Jean Dupont");
    expect(screen.getByLabelText("Montant (€)")).toHaveValue(850);

    // Close then reopen with different defaults
    rerender(
      <RecordManualPaymentDialog
        {...defaultProps}
        open={false}
        defaultPayerName="Marie Martin"
        defaultAmountCents={75000}
      />,
    );
    rerender(
      <RecordManualPaymentDialog
        {...defaultProps}
        open={true}
        defaultPayerName="Marie Martin"
        defaultAmountCents={75000}
      />,
    );

    expect(screen.getByLabelText("Nom du payeur")).toHaveValue("Marie Martin");
    expect(screen.getByLabelText("Montant (€)")).toHaveValue(750);
  });
});
