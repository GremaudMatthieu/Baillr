import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { RegularizationStatementCard } from "../regularization-statement-card";
import type { StatementData } from "@/lib/api/charge-regularization-api";

function makeStatement(overrides: Partial<StatementData> = {}): StatementData {
  return {
    leaseId: "lease-1",
    tenantId: "tenant-1",
    tenantName: "Dupont Jean",
    unitId: "unit-1",
    unitIdentifier: "Apt 1A",
    occupancyStart: "01/01/2025",
    occupancyEnd: "31/12/2025",
    occupiedDays: 365,
    daysInYear: 365,
    charges: [
      {
        chargeCategoryId: "cat-water",
        label: "Eau",
        totalChargeCents: 60000,
        tenantShareCents: 30000,
        provisionsPaidCents: 0,
        isWaterByConsumption: true,
      },
      {
        chargeCategoryId: "cat-teom",
        label: "TEOM",
        totalChargeCents: 40000,
        tenantShareCents: 20000,
        provisionsPaidCents: 20000,
        isWaterByConsumption: false,
      },
    ],
    totalShareCents: 50000,
    totalProvisionsPaidCents: 42000,
    balanceCents: 8000,
    ...overrides,
  };
}

describe("RegularizationStatementCard", () => {
  it("renders tenant name and unit identifier", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(
      screen.getByText("Dupont Jean — Apt 1A"),
    ).toBeInTheDocument();
  });

  it("renders occupancy period", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(
      screen.getByText(/01\/01\/2025/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/365 jours sur 365/),
    ).toBeInTheDocument();
  });

  it("renders charges table with all entries", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(screen.getByText("Eau")).toBeInTheDocument();
    expect(screen.getByText("TEOM")).toBeInTheDocument();
    expect(screen.getByText("Conso.")).toBeInTheDocument();
    expect(screen.getByText("Prorata")).toBeInTheDocument();
  });

  it("shows complément badge when balance is positive", () => {
    const statement = makeStatement({ balanceCents: 8000 });
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(screen.getByText("Complément")).toBeInTheDocument();
    expect(screen.getByText("Complément à régler")).toBeInTheDocument();
  });

  it("shows trop-perçu badge when balance is negative", () => {
    const statement = makeStatement({
      balanceCents: -5000,
      totalShareCents: 37000,
      totalProvisionsPaidCents: 42000,
    });
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(screen.getByText("Trop-perçu")).toBeInTheDocument();
    expect(screen.getByText("Trop-perçu à restituer")).toBeInTheDocument();
  });

  it("shows solde nul badge when balance is zero", () => {
    const statement = makeStatement({
      balanceCents: 0,
      totalShareCents: 42000,
      totalProvisionsPaidCents: 42000,
    });
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(screen.getByText("Solde nul")).toBeInTheDocument();
    expect(screen.getByText("Solde")).toBeInTheDocument();
  });

  it("renders totals section", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    expect(screen.getByText("Total charges locataire")).toBeInTheDocument();
    expect(screen.getByText("Provisions versées")).toBeInTheDocument();
  });

  it("calls onDownloadPdf with leaseId when button clicked", async () => {
    const user = userEvent.setup();
    const onDownloadPdf = vi.fn();
    const statement = makeStatement();

    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={onDownloadPdf}
        isDownloading={false}
        downloadingLeaseId={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Télécharger PDF/i }));
    expect(onDownloadPdf).toHaveBeenCalledWith("lease-1");
  });

  it("disables download button when this statement is downloading", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={true}
        downloadingLeaseId="lease-1"
      />,
    );

    expect(
      screen.getByRole("button", { name: /Télécharger PDF/i }),
    ).toBeDisabled();
  });

  it("keeps download button enabled when another statement is downloading", () => {
    const statement = makeStatement();
    renderWithProviders(
      <RegularizationStatementCard
        statement={statement}
        onDownloadPdf={vi.fn()}
        isDownloading={true}
        downloadingLeaseId="lease-other"
      />,
    );

    expect(
      screen.getByRole("button", { name: /Télécharger PDF/i }),
    ).not.toBeDisabled();
  });
});
