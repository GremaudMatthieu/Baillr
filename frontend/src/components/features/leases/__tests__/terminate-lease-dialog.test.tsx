import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { TerminateLeaseDialog } from "../terminate-lease-dialog";

describe("TerminateLeaseDialog", () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onOpenChange.mockReset();
    onConfirm.mockReset();
  });

  it("should render dialog when open", () => {
    renderWithProviders(
      <TerminateLeaseDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    expect(screen.getByText("Résilier ce bail")).toBeInTheDocument();
    expect(screen.getByLabelText("Date de fin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Résilier" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    renderWithProviders(
      <TerminateLeaseDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    expect(screen.queryByText("Résilier ce bail")).not.toBeInTheDocument();
  });

  it("should call onConfirm with ISO date when form is valid", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TerminateLeaseDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    const dateInput = screen.getByLabelText("Date de fin");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-06-15");

    await user.click(screen.getByRole("button", { name: "Résilier" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        expect.stringContaining("2026-06-15"),
      );
    });
  });

  it("should show validation error when date is empty and submit is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TerminateLeaseDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Résilier" }));

    await waitFor(() => {
      expect(screen.getByText("Date de fin requise")).toBeInTheDocument();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("should show submit error when provided", () => {
    renderWithProviders(
      <TerminateLeaseDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        submitError="Le bail est déjà résilié"
      />,
    );

    expect(
      screen.getByText("Le bail est déjà résilié"),
    ).toBeInTheDocument();
  });

  it("should show pending state when isPending is true", () => {
    renderWithProviders(
      <TerminateLeaseDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Résiliation…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeDisabled();
  });
});
