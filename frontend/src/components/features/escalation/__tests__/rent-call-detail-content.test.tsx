import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { RentCallDetailContent } from "../rent-call-detail-content";
import type { UnpaidRentCallData } from "@/lib/api/rent-calls-api";

const mockUnpaid: UnpaidRentCallData = {
  id: "rc-1",
  entityId: "entity-1",
  leaseId: "lease-1",
  tenantId: "tenant-1",
  unitId: "unit-1",
  month: "2026-01",
  totalAmountCents: 85000,
  paidAmountCents: null,
  remainingBalanceCents: null,
  paymentStatus: null,
  sentAt: "2026-01-01T00:00:00Z",
  tenantFirstName: "Jean",
  tenantLastName: "Dupont",
  tenantCompanyName: null,
  tenantType: "individual",
  unitIdentifier: "Apt 3B",
  dueDate: "2026-01-05T00:00:00Z",
  daysLate: 40,
};

const mockEscalation = {
  rentCallId: "rc-1",
  tier1SentAt: null,
  tier1RecipientEmail: null,
  tier2SentAt: null,
  tier3SentAt: null,
};

let mockEntityId: string | undefined = "entity-1";
let mockUnpaidData: UnpaidRentCallData[] = [mockUnpaid];
let mockEscalationData = mockEscalation;

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({ entityId: mockEntityId }),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({
    data: mockUnpaidData,
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-escalation", () => ({
  useEscalationStatus: () => ({
    data: mockEscalationData,
    isLoading: false,
  }),
  useSendReminderEmail: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
  }),
  useDownloadFormalNotice: () => ({
    download: vi.fn(),
    isDownloading: false,
    error: null,
  }),
  useDownloadStakeholderLetter: () => ({
    download: vi.fn(),
    isDownloading: false,
    downloadingType: null,
    error: null,
  }),
}));

describe("RentCallDetailContent", () => {
  beforeEach(() => {
    mockEntityId = "entity-1";
    mockUnpaidData = [mockUnpaid];
    mockEscalationData = mockEscalation;
  });

  it("should display rent call details", () => {
    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    // Name appears in heading and in details dl — check that both render
    expect(screen.getAllByText(/Jean Dupont/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Apt 3B")).toBeInTheDocument();
    expect(screen.getByText("2026-01")).toBeInTheDocument();
  });

  it("should display days late badge", () => {
    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    // Badge in header + dd in details — both contain 40 jours
    expect(screen.getAllByText(/40 jour/).length).toBeGreaterThanOrEqual(1);
  });

  it("should display the StatusTimeline", () => {
    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    expect(
      screen.getByText("Procédure de recouvrement"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tier 1 — Relance par email"),
    ).toBeInTheDocument();
  });

  it("should show back link", () => {
    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    expect(
      screen.getByRole("link", { name: /Retour aux impayés/ }),
    ).toHaveAttribute("href", "/rent-calls?filter=unpaid");
  });

  it("should show not found when rent call does not exist", () => {
    renderWithProviders(<RentCallDetailContent rentCallId="nonexistent" />);

    expect(
      screen.getByText("Appel de loyer introuvable"),
    ).toBeInTheDocument();
  });

  it("should show no entity message when entityId is undefined", () => {
    mockEntityId = undefined;
    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    expect(
      screen.getByText("Aucune entité sélectionnée"),
    ).toBeInTheDocument();
  });

  it("should display company name for company tenants", () => {
    mockUnpaidData = [
      {
        ...mockUnpaid,
        tenantType: "company",
        tenantCompanyName: "SARL Immobilia",
      },
    ];

    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    // Company name appears in heading and in details dl
    expect(screen.getAllByText(/SARL Immobilia/).length).toBeGreaterThanOrEqual(1);
  });

  it("should show partial payment badge when status is partial", () => {
    mockUnpaidData = [
      {
        ...mockUnpaid,
        paymentStatus: "partial",
        paidAmountCents: 40000,
        remainingBalanceCents: 45000,
      },
    ];

    renderWithProviders(<RentCallDetailContent rentCallId="rc-1" />);

    expect(screen.getByText("Paiement partiel")).toBeInTheDocument();
  });
});
