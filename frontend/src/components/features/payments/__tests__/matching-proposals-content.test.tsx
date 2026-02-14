import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { MatchingProposalsContent } from "../matching-proposals-content";

const mockMatchPayments = vi.fn();
let mockResult: unknown = null;
let mockError: string | null = null;
let mockIsPending = false;
let mockStatements: unknown[] = [];

const mockHandleValidate = vi.fn().mockResolvedValue(true);
const mockHandleReject = vi.fn().mockResolvedValue(true);
const mockHandleAssign = vi.fn().mockResolvedValue(true);
let mockProgress = { validated: 0, rejected: 0, assigned: 0 };
let mockActionError: string | null = null;
const mockGetRowStatus = vi.fn().mockReturnValue("default");

vi.mock("@/hooks/use-bank-statements", () => ({
  useBankStatements: () => ({
    data: mockStatements,
    isLoading: false,
  }),
  useMatchPayments: () => ({
    matchPayments: mockMatchPayments,
    isPending: mockIsPending,
    error: mockError,
    result: mockResult,
  }),
}));

vi.mock("@/hooks/use-payment-actions", () => ({
  usePaymentActions: () => ({
    handleValidate: mockHandleValidate,
    handleReject: mockHandleReject,
    handleAssign: mockHandleAssign,
    getRowStatus: mockGetRowStatus,
    progress: mockProgress,
    error: mockActionError,
  }),
}));

describe("MatchingProposalsContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResult = null;
    mockError = null;
    mockIsPending = false;
    mockActionError = null;
    mockProgress = { validated: 0, rejected: 0, assigned: 0 };
    mockGetRowStatus.mockReturnValue("default");
    mockStatements = [
      {
        id: "bs-1",
        bankAccountId: "ba-1",
        fileName: "releve-fev.csv",
        transactionCount: 5,
        importedAt: "2026-02-13T10:00:00Z",
      },
    ];
  });

  it("should render the rapprochement section title", () => {
    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByRole("heading", { name: "Rapprochement" }),
    ).toBeInTheDocument();
  });

  it("should render the ContinuousFlowStepper", () => {
    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByRole("list", { name: "Étapes du cycle mensuel" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
    expect(screen.getByText("Validation")).toBeInTheDocument();
    expect(screen.getByText("Terminé")).toBeInTheDocument();
  });

  it("should render statement and month selectors", () => {
    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByLabelText("Sélectionner un relevé bancaire"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Sélectionner le mois"),
    ).toBeInTheDocument();
  });

  it("should render the matching button", () => {
    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByRole("button", { name: /Lancer le rapprochement/i }),
    ).toBeInTheDocument();
  });

  it("should disable button when no statement selected", () => {
    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    const button = screen.getByRole("button", {
      name: /Lancer le rapprochement/i,
    });
    expect(button).toBeDisabled();
  });

  it("should display error message", () => {
    mockError = "Network error";

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("should display matching results with summary", () => {
    mockResult = {
      matches: [
        {
          transactionId: "tx-1",
          rentCallId: "rc-1",
          confidence: "high",
          score: 0.85,
          transaction: {
            id: "tx-1",
            date: "2026-02-05",
            amountCents: 85000,
            payerName: "Dupont Jean",
            reference: null,
          },
          rentCall: {
            id: "rc-1",
            tenantFirstName: "Jean",
            tenantLastName: "Dupont",
            companyName: null,
            unitIdentifier: "Apt 3B",
            leaseId: "lease-1",
            totalAmountCents: 85000,
            month: "2026-02",
          },
        },
      ],
      ambiguous: [],
      unmatched: [
        {
          transactionId: "tx-2",
          transaction: {
            id: "tx-2",
            date: "2026-02-10",
            amountCents: 99999,
            payerName: "Unknown",
            reference: null,
          },
        },
      ],
      summary: { matched: 1, unmatched: 1, ambiguous: 0, rentCallCount: 1 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    // Summary uses singular "rapproché" (vs stepper plural "rapprochés") — use exact boundary
    expect(screen.getByText("1 rapproché")).toBeInTheDocument();
    expect(screen.getByText(/1 non rapproché$/)).toBeInTheDocument();
    expect(
      screen.getByText("Rapprochements proposés"),
    ).toBeInTheDocument();
  });

  it("should display unmatched section", () => {
    mockResult = {
      matches: [],
      ambiguous: [],
      unmatched: [
        {
          transactionId: "tx-1",
          transaction: {
            id: "tx-1",
            date: "2026-02-05",
            amountCents: 85000,
            payerName: "Unknown",
            reference: null,
          },
        },
      ],
      summary: { matched: 0, unmatched: 1, ambiguous: 0, rentCallCount: 1 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(screen.getByText("0 rapprochés")).toBeInTheDocument();
    expect(screen.getByText("1 non rapproché")).toBeInTheDocument();
  });

  it("should display ambiguous section", () => {
    mockResult = {
      matches: [],
      ambiguous: [
        {
          transactionId: "tx-1",
          confidence: "medium",
          score: 0.6,
          transaction: {
            id: "tx-1",
            date: "2026-02-05",
            amountCents: 85000,
            payerName: "Dupont",
            reference: null,
          },
          candidates: [
            {
              rentCallId: "rc-1",
              score: 0.6,
              confidence: "medium",
              rentCall: {
                id: "rc-1",
                tenantFirstName: "Jean",
                tenantLastName: "Dupont",
                companyName: null,
                unitIdentifier: "Apt 3B",
                leaseId: "lease-1",
                totalAmountCents: 85000,
                month: "2026-02",
              },
            },
          ],
        },
      ],
      unmatched: [],
      summary: { matched: 0, unmatched: 0, ambiguous: 1, rentCallCount: 1 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(screen.getByText(/1 ambigu/)).toBeInTheDocument();
    expect(
      screen.getByText("Rapprochements ambigus"),
    ).toBeInTheDocument();
  });

  it("should display warning when no rent calls found", () => {
    mockResult = {
      matches: [],
      ambiguous: [],
      unmatched: [
        {
          transactionId: "tx-1",
          transaction: {
            id: "tx-1",
            date: "2026-02-05",
            amountCents: 85000,
            payerName: "Dupont Jean",
            reference: null,
          },
        },
      ],
      summary: { matched: 0, unmatched: 1, ambiguous: 0, rentCallCount: 0 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByText("Aucun appel de loyer trouvé pour ce mois"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Générez d'abord/),
    ).toBeInTheDocument();
  });

  it("should show loading state on button when pending", () => {
    mockIsPending = true;

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByRole("button", { name: /Rapprochement.../i }),
    ).toBeInTheDocument();
  });

  it("should display validation summary when progress exists", () => {
    mockProgress = { validated: 3, rejected: 1, assigned: 1 };
    mockResult = {
      matches: [],
      ambiguous: [],
      unmatched: [],
      summary: { matched: 0, unmatched: 0, ambiguous: 0, rentCallCount: 1 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByLabelText("Résumé de validation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3 paiements validés/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 rejeté/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 assigné manuellement/),
    ).toBeInTheDocument();
  });

  it("should render validate/reject buttons on matched rows", () => {
    mockResult = {
      matches: [
        {
          transactionId: "tx-1",
          rentCallId: "rc-1",
          confidence: "high",
          score: 0.85,
          transaction: {
            id: "tx-1",
            date: "2026-02-05",
            amountCents: 85000,
            payerName: "Dupont Jean",
            reference: null,
          },
          rentCall: {
            id: "rc-1",
            tenantFirstName: "Jean",
            tenantLastName: "Dupont",
            companyName: null,
            unitIdentifier: "Apt 3B",
            leaseId: "lease-1",
            totalAmountCents: 85000,
            month: "2026-02",
          },
        },
      ],
      ambiguous: [],
      unmatched: [],
      summary: { matched: 1, unmatched: 0, ambiguous: 0, rentCallCount: 1 },
      availableRentCalls: [],
    };

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(
      screen.getByLabelText("Valider le rapprochement"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rejeter le rapprochement"),
    ).toBeInTheDocument();
  });

  it("should display action error", () => {
    mockActionError = "Erreur de validation";

    renderWithProviders(
      <MatchingProposalsContent entityId="entity-1" />,
    );

    expect(screen.getByText("Erreur de validation")).toBeInTheDocument();
  });
});
