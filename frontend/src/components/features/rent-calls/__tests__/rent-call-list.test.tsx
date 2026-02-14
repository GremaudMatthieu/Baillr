import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { RentCallList } from "../rent-call-list";
import type { RentCallData } from "@/lib/api/rent-calls-api";

const baseRentCall: RentCallData = {
  id: "rc-1",
  entityId: "entity-1",
  leaseId: "lease-1",
  tenantId: "tenant-1",
  unitId: "unit-1",
  month: "2026-03",
  rentAmountCents: 80000,
  billingLines: [
    { label: "Charges", amountCents: 5000, type: "provision" },
  ],
  totalAmountCents: 85000,
  isProRata: false,
  occupiedDays: null,
  totalDaysInMonth: null,
  sentAt: null,
  paidAt: null,
  paidAmountCents: null,
  transactionId: null,
  bankStatementId: null,
  payerName: null,
  paymentDate: null,
  paymentMethod: null,
  paymentReference: null,
  recipientEmail: null,
  paymentStatus: null,
  remainingBalanceCents: null,
  overpaymentCents: null,
  createdAt: "2026-03-01T00:00:00.000Z",
};

const tenantNames = new Map([["tenant-1", "Jean Dupont"]]);
const unitIdentifiers = new Map([["unit-1", "Appt A1"]]);

describe("RentCallList", () => {
  it("should render empty state when no rent calls", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Aucun appel de loyer")).toBeInTheDocument();
  });

  it("should render rent call with tenant name and unit", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Appt A1")).toBeInTheDocument();
  });

  it("should format amounts in French currency", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    // Total amount: 850,00 €
    expect(screen.getByText(/850,00/)).toBeInTheDocument();
  });

  it("should display billing lines breakdown", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText(/Charges/)).toBeInTheDocument();
  });

  it("should show pro-rata badge when applicable", () => {
    const proRataRentCall: RentCallData = {
      ...baseRentCall,
      isProRata: true,
      occupiedDays: 15,
      totalDaysInMonth: 31,
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[proRataRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Pro-rata")).toBeInTheDocument();
  });

  it("should show fallback when tenant or unit unknown", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[{ ...baseRentCall, tenantId: "unknown", unitId: "unknown" }]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Locataire inconnu")).toBeInTheDocument();
    expect(screen.getByText("Lot inconnu")).toBeInTheDocument();
  });

  it("should render download PDF button when onDownloadPdf is provided", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onDownloadPdf={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /PDF/i }),
    ).toBeInTheDocument();
  });

  it("should not render download button when onDownloadPdf is not provided", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /PDF/i }),
    ).not.toBeInTheDocument();
  });

  it("should call onDownloadPdf when download button is clicked", async () => {
    const user = userEvent.setup();
    const onDownloadPdf = vi.fn();

    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onDownloadPdf={onDownloadPdf}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /PDF/i }),
    );
    expect(onDownloadPdf).toHaveBeenCalledWith("rc-1");
  });

  it("should disable download button when downloading", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onDownloadPdf={() => {}}
        downloadingId="rc-1"
      />,
    );

    const button = screen.getByRole("button", { name: /PDF/i });
    expect(button).toBeDisabled();
  });

  it("should disable all download buttons when any download is in progress", () => {
    const secondRentCall: RentCallData = {
      ...baseRentCall,
      id: "rc-2",
      tenantId: "tenant-1",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall, secondRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onDownloadPdf={() => {}}
        downloadingId="rc-1"
      />,
    );

    const buttons = screen.getAllByRole("button", { name: /PDF/i });
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("should show Envoyé badge when rent call has sentAt", () => {
    const sentRentCall: RentCallData = {
      ...baseRentCall,
      sentAt: "2026-03-05T10:00:00.000Z",
      recipientEmail: "jean@example.com",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[sentRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText(/Envoyé le/)).toBeInTheDocument();
  });

  it("should not show Envoyé badge when sentAt is null", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.queryByText(/Envoyé le/)).not.toBeInTheDocument();
  });

  it("should show Payé badge with payment method icon for paid rent call", () => {
    const paidRentCall: RentCallData = {
      ...baseRentCall,
      paidAt: "2026-03-10T12:00:00.000Z",
      paidAmountCents: 85000,
      paymentDate: "2026-03-10T00:00:00.000Z",
      paymentMethod: "cash",
      payerName: "Jean Dupont",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[paidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText(/Payé le/)).toBeInTheDocument();
  });

  it("should hide record payment button for paid rent call", () => {
    const paidRentCall: RentCallData = {
      ...baseRentCall,
      paidAt: "2026-03-10T12:00:00.000Z",
      paidAmountCents: 85000,
      paymentDate: "2026-03-10T00:00:00.000Z",
      paymentMethod: "bank_transfer",
      payerName: "Jean Dupont",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[paidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Enregistrer un paiement/i }),
    ).not.toBeInTheDocument();
  });

  it("should show record payment button for unpaid rent call", () => {
    const onRecordPayment = vi.fn();

    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={onRecordPayment}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Enregistrer un paiement/i }),
    ).toBeInTheDocument();
  });

  it("should call onRecordPayment when button is clicked", async () => {
    const user = userEvent.setup();
    const onRecordPayment = vi.fn();

    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={onRecordPayment}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Enregistrer un paiement/i }),
    );
    expect(onRecordPayment).toHaveBeenCalledWith("rc-1");
  });

  it("should not show record payment button when callback not provided", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Enregistrer un paiement/i }),
    ).not.toBeInTheDocument();
  });

  it("should show partial payment badge with amber styling", () => {
    const partialRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "partial",
      paidAmountCents: 50000,
      remainingBalanceCents: 35000,
      paymentMethod: "bank_transfer",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[partialRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    const badge = screen.getByText(/Partiellement payé/);
    expect(badge).toBeInTheDocument();
    // Badge text contains paid/total amounts
    expect(badge.textContent).toMatch(/500,00/);
    expect(badge.textContent).toMatch(/850,00/);
  });

  it("should show record payment button for partially paid rent call", () => {
    const partialRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "partial",
      paidAmountCents: 50000,
      remainingBalanceCents: 35000,
      paymentMethod: "bank_transfer",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[partialRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={() => {}}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Enregistrer un paiement/i }),
    ).toBeInTheDocument();
  });

  it("should show overpaid badge with overpayment amount", () => {
    const overpaidRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "overpaid",
      paidAmountCents: 90000,
      paidAt: "2026-03-10T12:00:00.000Z",
      overpaymentCents: 5000,
      paymentMethod: "cash",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[overpaidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    const badge = screen.getByText(/trop-perçu/);
    expect(badge).toBeInTheDocument();
    // Badge text includes overpayment amount
    expect(badge.textContent).toMatch(/50,00/);
  });

  it("should hide record payment button for overpaid rent call", () => {
    const overpaidRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "overpaid",
      paidAmountCents: 90000,
      paidAt: "2026-03-10T12:00:00.000Z",
      overpaymentCents: 5000,
      paymentMethod: "cash",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[overpaidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Enregistrer un paiement/i }),
    ).not.toBeInTheDocument();
  });

  it("should hide record payment button for rent call with paymentStatus paid", () => {
    const paidRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "paid",
      paidAt: "2026-03-10T12:00:00.000Z",
      paidAmountCents: 85000,
      paymentMethod: "bank_transfer",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[paidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onRecordPayment={() => {}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Enregistrer un paiement/i }),
    ).not.toBeInTheDocument();
  });

  it("should show payment history toggle for paid rent call", () => {
    const paidRentCall: RentCallData = {
      ...baseRentCall,
      paymentStatus: "paid",
      paidAt: "2026-03-10T12:00:00.000Z",
      paidAmountCents: 85000,
      paymentMethod: "bank_transfer",
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[paidRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Voir les paiements")).toBeInTheDocument();
  });

  it("should not show payment history toggle for unpaid rent call", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.queryByText("Voir les paiements")).not.toBeInTheDocument();
  });

  it("should display download error when present", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
        onDownloadPdf={() => {}}
        downloadError="Erreur de téléchargement"
      />,
    );

    expect(screen.getByText("Erreur de téléchargement")).toBeInTheDocument();
  });
});
