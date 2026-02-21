import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { SendRegisteredMailDialog } from "../send-registered-mail-dialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  costCentsTtc: 479,
  costCentsHt: 399,
  isSending: false,
  onConfirm: vi.fn(),
  error: null,
};

describe("SendRegisteredMailDialog", () => {
  it("should render dialog with cost information", () => {
    renderWithProviders(<SendRegisteredMailDialog {...defaultProps} />);

    expect(
      screen.getByText("Envoyer en lettre recommandée électronique"),
    ).toBeInTheDocument();
    expect(screen.getByText(/3,99/)).toBeInTheDocument();
    expect(screen.getByText(/4,79/)).toBeInTheDocument();
  });

  it("should call onConfirm when clicking confirm button", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <SendRegisteredMailDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    await user.click(
      screen.getByRole("button", { name: /Confirmer l'envoi/ }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should disable buttons when sending", () => {
    renderWithProviders(
      <SendRegisteredMailDialog {...defaultProps} isSending={true} />,
    );

    expect(
      screen.getByRole("button", { name: /Confirmer l'envoi/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: /Annuler/ })).toBeDisabled();
  });

  it("should show error message when error is set", () => {
    renderWithProviders(
      <SendRegisteredMailDialog
        {...defaultProps}
        error="Erreur lors de l'envoi"
      />,
    );

    expect(screen.getByText("Erreur lors de l'envoi")).toBeInTheDocument();
  });

  it("should not render content when closed", () => {
    renderWithProviders(
      <SendRegisteredMailDialog {...defaultProps} open={false} />,
    );

    expect(
      screen.queryByText("Envoyer en lettre recommandée électronique"),
    ).not.toBeInTheDocument();
  });

  it("should show AR24 mention", () => {
    renderWithProviders(<SendRegisteredMailDialog {...defaultProps} />);

    const ar24Mentions = screen.getAllByText(/AR24/);
    expect(ar24Mentions.length).toBeGreaterThanOrEqual(1);
  });
});
