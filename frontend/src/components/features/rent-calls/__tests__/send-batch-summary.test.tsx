import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { SendBatchSummary } from "../send-batch-summary";

describe("SendBatchSummary", () => {
  it("should render sent count", () => {
    renderWithProviders(
      <SendBatchSummary
        sent={3}
        failed={0}
        totalAmountCents={255000}
        failures={[]}
      />,
    );

    expect(screen.getByText("Envoi terminé")).toBeInTheDocument();
    expect(screen.getByText(/3 appels de loyer/)).toBeInTheDocument();
    expect(screen.getByText(/envoyés par email/)).toBeInTheDocument();
  });

  it("should render total amount", () => {
    renderWithProviders(
      <SendBatchSummary
        sent={2}
        failed={0}
        totalAmountCents={170000}
        failures={[]}
      />,
    );

    // 1 700,00 € — Intl.NumberFormat whitespace varies
    expect(screen.getByText(/1.700,00/)).toBeInTheDocument();
  });

  it("should render failures section with tenant names", () => {
    renderWithProviders(
      <SendBatchSummary
        sent={1}
        failed={2}
        totalAmountCents={85000}
        failures={["Jean Dupont (email manquant)", "Marie Martin (SMTP error)"]}
      />,
    );

    expect(screen.getByText(/2 envois échoués/)).toBeInTheDocument();
    expect(screen.getByText(/Jean Dupont/)).toBeInTheDocument();
    expect(screen.getByText(/Marie Martin/)).toBeInTheDocument();
  });

  it("should not render failures section when none failed", () => {
    renderWithProviders(
      <SendBatchSummary
        sent={3}
        failed={0}
        totalAmountCents={255000}
        failures={[]}
      />,
    );

    expect(screen.queryByText(/échoué/)).not.toBeInTheDocument();
  });
});
