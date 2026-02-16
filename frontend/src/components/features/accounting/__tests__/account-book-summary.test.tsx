import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AccountBookSummary } from "../account-book-summary";

describe("AccountBookSummary", () => {
  it("should display total balance and entry count", () => {
    render(
      <AccountBookSummary totalBalanceCents={150000} entryCount={42} />,
    );

    expect(screen.getByText(/1.500,00/)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Solde total")).toBeInTheDocument();
    expect(screen.getByText("Écritures")).toBeInTheDocument();
  });

  it("should display negative balance in red", () => {
    render(
      <AccountBookSummary totalBalanceCents={-50000} entryCount={5} />,
    );

    const balanceElement = screen.getByText(/500,00/);
    expect(balanceElement.className).toContain("text-red-600");
  });

  it("should not display red for zero balance", () => {
    render(
      <AccountBookSummary totalBalanceCents={0} entryCount={0} />,
    );

    const balanceElement = screen.getByText(/0,00/);
    expect(balanceElement.className).not.toContain("text-red-600");
  });

  it("should display positive balance without red", () => {
    render(
      <AccountBookSummary totalBalanceCents={80000} entryCount={10} />,
    );

    const balanceElement = screen.getByText(/800,00/);
    expect(balanceElement.className).not.toContain("text-red-600");
  });
});
