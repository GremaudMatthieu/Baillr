import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import {
  MatchedRow,
  AmbiguousRow,
  UnmatchedRow,
} from "../matching-row";
import type {
  MatchProposal,
  AmbiguousMatch,
  UnmatchedTransaction,
} from "@/hooks/use-bank-statements";

const makeTransaction = (overrides = {}) => ({
  id: "tx-1",
  date: "2026-02-05",
  amountCents: 85000,
  payerName: "Dupont Jean",
  reference: "VIR LOYER FEV",
  ...overrides,
});

const makeRentCall = (overrides = {}) => ({
  id: "rc-1",
  tenantFirstName: "Jean",
  tenantLastName: "Dupont",
  companyName: null,
  unitIdentifier: "Apt 3B",
  leaseId: "lease-1",
  totalAmountCents: 85000,
  month: "2026-02",
  ...overrides,
});

describe("MatchedRow", () => {
  const defaultMatch: MatchProposal = {
    transactionId: "tx-1",
    rentCallId: "rc-1",
    confidence: "high",
    score: 0.85,
    transaction: makeTransaction(),
    rentCall: makeRentCall(),
  };

  it("should render transaction details on the left", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    expect(screen.getByText("Dupont Jean")).toBeInTheDocument();
    expect(screen.getByText("VIR LOYER FEV")).toBeInTheDocument();
  });

  it("should render rent call details on the right", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    expect(screen.getByText("Apt 3B")).toBeInTheDocument();
    expect(screen.getByText("2026-02")).toBeInTheDocument();
  });

  it("should render high confidence badge in green", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    const badge = screen.getByText("Élevée");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-green-100");
  });

  it("should render medium confidence badge in yellow", () => {
    renderWithProviders(
      <MatchedRow match={{ ...defaultMatch, confidence: "medium" }} />,
    );

    const badge = screen.getByText("Moyenne");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-yellow-100");
  });

  it("should render low confidence badge in orange", () => {
    renderWithProviders(
      <MatchedRow match={{ ...defaultMatch, confidence: "low" }} />,
    );

    const badge = screen.getByText("Faible");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-orange-100");
  });

  it("should be keyboard-navigable with tabIndex", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("should have screen reader labels", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Dupont Jean"),
    );
  });

  it("should render company name for company tenants", () => {
    renderWithProviders(
      <MatchedRow
        match={{
          ...defaultMatch,
          rentCall: makeRentCall({
            companyName: "SCI Les Tilleuls",
            tenantFirstName: null,
            tenantLastName: null,
          }),
        }}
      />,
    );

    expect(screen.getByText("SCI Les Tilleuls")).toBeInTheDocument();
  });

  it("should format amounts as EUR", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    // Both transaction and rent call show 850,00 €
    const amounts = screen.getAllByText(/850,00/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it("should render validate and reject buttons in default state", () => {
    renderWithProviders(<MatchedRow match={defaultMatch} />);

    expect(
      screen.getByLabelText("Valider le rapprochement"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rejeter le rapprochement"),
    ).toBeInTheDocument();
  });

  it("should call onValidate when validate button is clicked", async () => {
    const user = userEvent.setup();
    const onValidate = vi.fn();

    renderWithProviders(
      <MatchedRow match={defaultMatch} onValidate={onValidate} />,
    );

    await user.click(screen.getByLabelText("Valider le rapprochement"));
    expect(onValidate).toHaveBeenCalledWith("tx-1", "rc-1");
  });

  it("should call onReject when reject button is clicked", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();

    renderWithProviders(
      <MatchedRow match={defaultMatch} onReject={onReject} />,
    );

    await user.click(screen.getByLabelText("Rejeter le rapprochement"));
    expect(onReject).toHaveBeenCalledWith("tx-1");
  });

  it("should render green state when validated", () => {
    renderWithProviders(
      <MatchedRow match={defaultMatch} status="validated" />,
    );

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("bg-green-50");
    expect(screen.getByText("Validé")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Valider le rapprochement"),
    ).not.toBeInTheDocument();
  });

  it("should render dimmed state when rejected", () => {
    renderWithProviders(
      <MatchedRow match={defaultMatch} status="rejected" />,
    );

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("opacity-60");
    expect(row.className).toContain("line-through");
    expect(screen.getByText("Rejeté")).toBeInTheDocument();
  });

  it("should render loading spinner when loading", () => {
    renderWithProviders(
      <MatchedRow match={defaultMatch} status="loading" />,
    );

    expect(screen.getByLabelText("Chargement")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Valider le rapprochement"),
    ).not.toBeInTheDocument();
  });
});

describe("AmbiguousRow", () => {
  const ambiguousMatch: AmbiguousMatch = {
    transactionId: "tx-1",
    confidence: "medium",
    score: 0.6,
    transaction: makeTransaction(),
    candidates: [
      {
        rentCallId: "rc-1",
        score: 0.6,
        confidence: "medium",
        rentCall: makeRentCall(),
      },
      {
        rentCallId: "rc-2",
        score: 0.55,
        confidence: "medium",
        rentCall: makeRentCall({
          id: "rc-2",
          tenantFirstName: "Marie",
          tenantLastName: "Dupont",
          unitIdentifier: "Apt 4A",
        }),
      },
    ],
  };

  it("should render with yellow border and background", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("border-yellow-300");
    expect(row.className).toContain("bg-yellow-50");
  });

  it("should render a select dropdown", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    expect(
      screen.getByLabelText("Sélectionner le bon rapprochement"),
    ).toBeInTheDocument();
  });

  it("should be keyboard-navigable", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("should have screen reader label for ambiguous state", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("plusieurs rapprochements possibles"),
    );
  });

  it("should render validate and reject buttons", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    expect(
      screen.getByLabelText("Valider le rapprochement"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Rejeter le rapprochement"),
    ).toBeInTheDocument();
  });

  it("should disable validate button when no candidate selected", () => {
    renderWithProviders(<AmbiguousRow match={ambiguousMatch} />);

    const validateBtn = screen.getByLabelText("Valider le rapprochement");
    expect(validateBtn).toBeDisabled();
  });

  it("should render validated state", () => {
    renderWithProviders(
      <AmbiguousRow match={ambiguousMatch} status="validated" />,
    );

    expect(screen.getByText("Validé")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Valider le rapprochement"),
    ).not.toBeInTheDocument();
  });
});

describe("UnmatchedRow", () => {
  const unmatchedTx: UnmatchedTransaction = {
    transactionId: "tx-1",
    transaction: makeTransaction(),
  };

  it("should render with orange border and background", () => {
    renderWithProviders(<UnmatchedRow transaction={unmatchedTx} />);

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("border-orange-300");
    expect(row.className).toContain("bg-orange-50");
  });

  it("should render 'Aucun rapprochement trouvé' label", () => {
    renderWithProviders(<UnmatchedRow transaction={unmatchedTx} />);

    expect(
      screen.getByText("Aucun rapprochement trouvé"),
    ).toBeInTheDocument();
  });

  it("should be keyboard-navigable", () => {
    renderWithProviders(<UnmatchedRow transaction={unmatchedTx} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("should have screen reader label", () => {
    renderWithProviders(<UnmatchedRow transaction={unmatchedTx} />);

    const row = screen.getByRole("listitem");
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("sans rapprochement"),
    );
  });

  it("should handle null payerName gracefully", () => {
    renderWithProviders(
      <UnmatchedRow
        transaction={{
          ...unmatchedTx,
          transaction: makeTransaction({ payerName: null }),
        }}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("should render reject button", () => {
    renderWithProviders(<UnmatchedRow transaction={unmatchedTx} />);

    expect(
      screen.getByLabelText("Rejeter le rapprochement"),
    ).toBeInTheDocument();
  });

  it("should call onReject when reject button is clicked", async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();

    renderWithProviders(
      <UnmatchedRow transaction={unmatchedTx} onReject={onReject} />,
    );

    await user.click(screen.getByLabelText("Rejeter le rapprochement"));
    expect(onReject).toHaveBeenCalledWith("tx-1");
  });

  it("should render manual assignment dropdown when rent calls available", () => {
    const availableRentCalls = [
      {
        id: "rc-1",
        tenantFirstName: "Jean",
        tenantLastName: "Dupont",
        companyName: null,
        unitIdentifier: "Apt 3B",
        totalAmountCents: 85000,
        month: "2026-02",
      },
    ];

    renderWithProviders(
      <UnmatchedRow
        transaction={unmatchedTx}
        availableRentCalls={availableRentCalls}
      />,
    );

    expect(
      screen.getByLabelText("Assigner à un appel de loyer"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Assigner le paiement"),
    ).toBeInTheDocument();
  });

  it("should render assigned state", () => {
    renderWithProviders(
      <UnmatchedRow transaction={unmatchedTx} status="assigned" />,
    );

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("bg-blue-50");
    expect(screen.getByText("Assigné")).toBeInTheDocument();
  });

  it("should render rejected state", () => {
    renderWithProviders(
      <UnmatchedRow transaction={unmatchedTx} status="rejected" />,
    );

    const row = screen.getByRole("listitem");
    expect(row.className).toContain("opacity-60");
    expect(screen.getByText("Rejeté")).toBeInTheDocument();
  });
});
