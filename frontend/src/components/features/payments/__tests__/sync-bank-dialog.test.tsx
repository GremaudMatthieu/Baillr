import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { SyncBankDialog } from "../sync-bank-dialog";

describe("SyncBankDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isSyncing: false,
    connectionCount: 1,
    institutionName: "BNP Paribas",
  };

  it("should display dialog title and description with institution name", () => {
    renderWithProviders(<SyncBankDialog {...defaultProps} />);

    expect(
      screen.getByText("Synchroniser ma banque"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/BNP Paribas/),
    ).toBeInTheDocument();
  });

  it("should display connection count when multiple connections", () => {
    renderWithProviders(
      <SyncBankDialog
        {...defaultProps}
        connectionCount={3}
        institutionName={null}
      />,
    );

    expect(screen.getByText(/3 connexions/)).toBeInTheDocument();
  });

  it("should call onConfirm without dates by default", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <SyncBankDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Synchroniser/i }),
    );

    expect(onConfirm).toHaveBeenCalledWith();
  });

  it("should show date fields when checkbox is checked", async () => {
    renderWithProviders(<SyncBankDialog {...defaultProps} />);

    expect(screen.queryByLabelText("Du")).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Limiter à une période/));

    expect(screen.getByLabelText("Du")).toBeInTheDocument();
    expect(screen.getByLabelText("Au")).toBeInTheDocument();
  });

  it("should call onConfirm with dates when date range is active", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <SyncBankDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    await userEvent.click(screen.getByLabelText(/Limiter à une période/));

    const sinceInput = screen.getByLabelText("Du");
    const untilInput = screen.getByLabelText("Au");

    await userEvent.clear(sinceInput);
    await userEvent.type(sinceInput, "2026-01-01");
    await userEvent.clear(untilInput);
    await userEvent.type(untilInput, "2026-01-31");

    await userEvent.click(
      screen.getByRole("button", { name: /Synchroniser/i }),
    );

    expect(onConfirm).toHaveBeenCalledWith("2026-01-01", "2026-01-31");
  });

  it("should disable buttons when syncing", () => {
    renderWithProviders(
      <SyncBankDialog {...defaultProps} isSyncing={true} />,
    );

    expect(
      screen.getByRole("button", { name: /Synchroniser/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Annuler/i }),
    ).toBeDisabled();
  });

  it("should display dedup reassurance", () => {
    renderWithProviders(<SyncBankDialog {...defaultProps} />);

    expect(
      screen.getByText(/doublons seront automatiquement ignorés/),
    ).toBeInTheDocument();
  });
});
