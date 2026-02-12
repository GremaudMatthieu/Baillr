import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { GenerateRentCallsDialog } from "../generate-rent-calls-dialog";

describe("GenerateRentCallsDialog", () => {
  const onOpenChange = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    onOpenChange.mockReset();
    onConfirm.mockReset();
  });

  it("should render dialog with month and lease count", () => {
    renderWithProviders(
      <GenerateRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        activeLeaseCount={3}
      />,
    );

    expect(
      screen.getByText("Générer les appels de loyer"),
    ).toBeInTheDocument();
    expect(screen.getByText(/mars 2026/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/actif/)).toBeInTheDocument();
  });

  it("should call onConfirm when clicking Générer", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GenerateRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        activeLeaseCount={2}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Générer" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("should show loading state when isPending", () => {
    renderWithProviders(
      <GenerateRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={true}
        month="2026-03"
        activeLeaseCount={2}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Génération…" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeDisabled();
  });

  it("should not render when closed", () => {
    renderWithProviders(
      <GenerateRentCallsDialog
        open={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        activeLeaseCount={2}
      />,
    );

    expect(
      screen.queryByText("Générer les appels de loyer"),
    ).not.toBeInTheDocument();
  });

  it("should display submit error when provided", () => {
    renderWithProviders(
      <GenerateRentCallsDialog
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
        month="2026-03"
        activeLeaseCount={2}
        submitError="Appels de loyer déjà générés pour ce mois"
      />,
    );

    expect(
      screen.getByText("Appels de loyer déjà générés pour ce mois"),
    ).toBeInTheDocument();
  });
});
