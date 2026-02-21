import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { StatusTimeline } from "../status-timeline";
import type { EscalationStatusData } from "@/lib/api/escalation-api";

const defaultProps = {
  onSendReminder: vi.fn(),
  isSendingReminder: false,
  onDownloadFormalNotice: vi.fn(),
  isDownloadingFormalNotice: false,
  onDownloadStakeholderLetter: vi.fn() as (
    type: "insurance" | "lawyer" | "guarantor",
  ) => void,
  isDownloadingStakeholder: false,
  downloadingStakeholderType: null,
  isRegisteredMailAvailable: false,
  onSendRegisteredMail: vi.fn(),
  isSendingRegisteredMail: false,
};

describe("StatusTimeline", () => {
  it("should render all 3 tiers", () => {
    renderWithProviders(
      <StatusTimeline escalation={null} {...defaultProps} />,
    );

    expect(screen.getByText("Tier 1 — Relance par email")).toBeInTheDocument();
    expect(screen.getByText("Tier 2 — Mise en demeure")).toBeInTheDocument();
    expect(
      screen.getByText("Tier 3 — Signalements aux tiers"),
    ).toBeInTheDocument();
  });

  it("should show action buttons when no escalation exists", () => {
    renderWithProviders(
      <StatusTimeline escalation={null} {...defaultProps} />,
    );

    expect(
      screen.getByRole("button", { name: /Envoyer la relance/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Générer la mise en demeure/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Assureur/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Avocat/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Garant/ }),
    ).toBeInTheDocument();
  });

  it("should show completed state for tier 1 when sent", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: "2026-02-10T10:00:00Z",
      tier1RecipientEmail: "jean@test.com",
      tier2SentAt: null,
      tier3SentAt: null,
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    expect(screen.getByText(/10 février 2026/)).toBeInTheDocument();
    expect(screen.getByText(/jean@test.com/)).toBeInTheDocument();
    // Tier 1 should not show the send button anymore
    expect(
      screen.queryByRole("button", { name: /Envoyer la relance/ }),
    ).not.toBeInTheDocument();
  });

  it("should show completed state for all tiers", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: "2026-02-10T10:00:00Z",
      tier1RecipientEmail: "jean@test.com",
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: "2026-02-14T10:00:00Z",
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    // All 3 tiers should show "Effectué" badges
    const badges = screen.getAllByText("Effectué");
    expect(badges).toHaveLength(3);
  });

  it("should call onSendReminder when clicking tier 1 button", async () => {
    const user = userEvent.setup();
    const onSendReminder = vi.fn();

    renderWithProviders(
      <StatusTimeline
        escalation={null}
        {...defaultProps}
        onSendReminder={onSendReminder}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Envoyer la relance/ }),
    );

    expect(onSendReminder).toHaveBeenCalledTimes(1);
  });

  it("should call onDownloadFormalNotice when clicking tier 2 button", async () => {
    const user = userEvent.setup();
    const onDownloadFormalNotice = vi.fn();

    renderWithProviders(
      <StatusTimeline
        escalation={null}
        {...defaultProps}
        onDownloadFormalNotice={onDownloadFormalNotice}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Générer la mise en demeure/ }),
    );

    expect(onDownloadFormalNotice).toHaveBeenCalledTimes(1);
  });

  it("should call onDownloadStakeholderLetter with correct type", async () => {
    const user = userEvent.setup();
    const onDownloadStakeholderLetter = vi.fn();

    renderWithProviders(
      <StatusTimeline
        escalation={null}
        {...defaultProps}
        onDownloadStakeholderLetter={onDownloadStakeholderLetter}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Assureur/ }));
    expect(onDownloadStakeholderLetter).toHaveBeenCalledWith("insurance");

    await user.click(screen.getByRole("button", { name: /Avocat/ }));
    expect(onDownloadStakeholderLetter).toHaveBeenCalledWith("lawyer");

    await user.click(screen.getByRole("button", { name: /Garant/ }));
    expect(onDownloadStakeholderLetter).toHaveBeenCalledWith("guarantor");
  });

  it("should disable reminder button when sending", () => {
    renderWithProviders(
      <StatusTimeline
        escalation={null}
        {...defaultProps}
        isSendingReminder={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Envoyer la relance/ }),
    ).toBeDisabled();
  });

  it("should show re-download button for completed tier 2", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    expect(
      screen.getByRole("button", { name: /Re-télécharger le PDF/ }),
    ).toBeInTheDocument();
  });

  it("should show 'Disponible' badges for available tiers", () => {
    renderWithProviders(
      <StatusTimeline escalation={null} {...defaultProps} />,
    );

    const badges = screen.getAllByText("Disponible");
    expect(badges).toHaveLength(3);
  });

  it("should render the card title", () => {
    renderWithProviders(
      <StatusTimeline escalation={null} {...defaultProps} />,
    );

    expect(
      screen.getByText("Procédure de recouvrement"),
    ).toBeInTheDocument();
  });

  it("should hide registered mail button when not available", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline
        escalation={escalation}
        {...defaultProps}
        isRegisteredMailAvailable={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Envoyer en recommandé/ }),
    ).not.toBeInTheDocument();
  });

  it("should show registered mail button when available and tier 2 completed", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline
        escalation={escalation}
        {...defaultProps}
        isRegisteredMailAvailable={true}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Envoyer en recommandé/ }),
    ).toBeInTheDocument();
  });

  it("should call onSendRegisteredMail when clicking registered mail button", async () => {
    const user = userEvent.setup();
    const onSendRegisteredMail = vi.fn();

    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: null,
      registeredMailProvider: null,
      registeredMailCostCents: null,
      registeredMailDispatchedAt: null,
      registeredMailStatus: null,
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline
        escalation={escalation}
        {...defaultProps}
        isRegisteredMailAvailable={true}
        onSendRegisteredMail={onSendRegisteredMail}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Envoyer en recommandé/ }),
    );

    expect(onSendRegisteredMail).toHaveBeenCalledTimes(1);
  });

  it("should hide registered mail button when already dispatched", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: "LRE-2026-001",
      registeredMailProvider: "ar24",
      registeredMailCostCents: 479,
      registeredMailDispatchedAt: "2026-02-13T10:00:00Z",
      registeredMailStatus: "waiting",
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline
        escalation={escalation}
        {...defaultProps}
        isRegisteredMailAvailable={true}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Envoyer en recommandé/ }),
    ).not.toBeInTheDocument();
  });

  it("should show tracking info when registered mail dispatched", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: "LRE-2026-001",
      registeredMailProvider: "ar24",
      registeredMailCostCents: 479,
      registeredMailDispatchedAt: "2026-02-13T10:00:00Z",
      registeredMailStatus: "waiting",
      registeredMailProofUrl: null,
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    expect(screen.getByText("Lettre recommandée")).toBeInTheDocument();
    expect(screen.getByText("LRE-2026-001")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getByText(/13 février 2026/)).toBeInTheDocument();
  });

  it("should show AR status badge for acknowledged receipt", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: "LRE-2026-001",
      registeredMailProvider: "ar24",
      registeredMailCostCents: 479,
      registeredMailDispatchedAt: "2026-02-13T10:00:00Z",
      registeredMailStatus: "AR",
      registeredMailProofUrl: "https://ar24.fr/proof/123",
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    expect(screen.getByText("Accusé de réception")).toBeInTheDocument();
    expect(screen.getByText("Télécharger")).toBeInTheDocument();
  });

  it("should not render proof URL link for non-https URLs", () => {
    const escalation: EscalationStatusData = {
      rentCallId: "rc-1",
      tier1SentAt: null,
      tier1RecipientEmail: null,
      tier2SentAt: "2026-02-12T10:00:00Z",
      tier3SentAt: null,
      registeredMailTrackingId: "LRE-2026-001",
      registeredMailProvider: "ar24",
      registeredMailCostCents: 479,
      registeredMailDispatchedAt: "2026-02-13T10:00:00Z",
      registeredMailStatus: "AR",
      registeredMailProofUrl: "javascript:alert(1)",
    };

    renderWithProviders(
      <StatusTimeline escalation={escalation} {...defaultProps} />,
    );

    expect(screen.queryByText("Télécharger")).not.toBeInTheDocument();
  });

  it("should not show registered mail button when tier 2 not completed", () => {
    renderWithProviders(
      <StatusTimeline
        escalation={null}
        {...defaultProps}
        isRegisteredMailAvailable={true}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /Envoyer en recommandé/ }),
    ).not.toBeInTheDocument();
  });
});
