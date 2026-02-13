import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { SendRentCallsDialog } from "../send-rent-calls-dialog";

describe("SendRentCallsDialog", () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onOpenChange.mockReset();
    onConfirm.mockReset();
  });

  it("should render dialog with unsent count and month", () => {
    renderWithProviders(
      <SendRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        unsentCount={5}
        missingEmailCount={0}
      />,
    );

    expect(
      screen.getByText("Envoyer les appels de loyer par email"),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 appels de loyer/)).toBeInTheDocument();
    expect(screen.getByText(/mars 2026/)).toBeInTheDocument();
  });

  it("should show missing email warning when applicable", () => {
    renderWithProviders(
      <SendRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        unsentCount={5}
        missingEmailCount={2}
      />,
    );

    expect(screen.getByText(/2 locataires sans email/)).toBeInTheDocument();
  });

  it("should call onConfirm when clicking Envoyer", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <SendRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        unsentCount={3}
        missingEmailCount={0}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show loading state when isPending", () => {
    renderWithProviders(
      <SendRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
        month="2026-03"
        unsentCount={3}
        missingEmailCount={0}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Envoi en cours…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeDisabled();
  });

  it("should display submit error when provided", () => {
    renderWithProviders(
      <SendRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        unsentCount={3}
        missingEmailCount={0}
        submitError="Erreur SMTP"
      />,
    );

    expect(screen.getByText("Erreur SMTP")).toBeInTheDocument();
  });

  it("should not render when closed", () => {
    renderWithProviders(
      <SendRentCallsDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        unsentCount={3}
        missingEmailCount={0}
      />,
    );

    expect(
      screen.queryByText("Envoyer les appels de loyer par email"),
    ).not.toBeInTheDocument();
  });
});
