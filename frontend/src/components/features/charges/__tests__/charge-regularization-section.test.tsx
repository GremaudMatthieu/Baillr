import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ChargeRegularizationSection } from "../charge-regularization-section";

let mockRegularizationData: unknown = null;
let mockIsLoading = false;
const mockCalculateMutate = vi.fn();
let mockCalculateIsPending = false;
let mockCalculateIsError = false;
let mockCalculateIsSuccess = false;
const mockApplyMutate = vi.fn();
let mockApplyIsPending = false;
let mockApplyIsError = false;
const mockSendMutate = vi.fn();
let mockSendIsPending = false;
let mockSendIsError = false;
const mockSettleMutate = vi.fn();
let mockSettleIsPending = false;
let mockSettleIsError = false;
const mockDownloadPdf = vi.fn();
let mockIsDownloading = false;
let mockDownloadingLeaseId: string | null = null;
let mockDownloadError: string | null = null;

vi.mock("@/hooks/use-charge-regularization", () => ({
  useChargeRegularization: () => ({
    data: mockRegularizationData,
    isLoading: mockIsLoading,
  }),
  useCalculateChargeRegularization: () => ({
    mutate: mockCalculateMutate,
    isPending: mockCalculateIsPending,
    isError: mockCalculateIsError,
    isSuccess: mockCalculateIsSuccess,
  }),
  useApplyChargeRegularization: () => ({
    mutate: mockApplyMutate,
    isPending: mockApplyIsPending,
    isError: mockApplyIsError,
  }),
  useSendChargeRegularization: () => ({
    mutate: mockSendMutate,
    isPending: mockSendIsPending,
    isError: mockSendIsError,
  }),
  useSettleChargeRegularization: () => ({
    mutate: mockSettleMutate,
    isPending: mockSettleIsPending,
    isError: mockSettleIsError,
  }),
}));

vi.mock("@/hooks/use-download-regularization-pdf", () => ({
  useDownloadRegularizationPdf: () => ({
    downloadPdf: mockDownloadPdf,
    isDownloading: mockIsDownloading,
    downloadingLeaseId: mockDownloadingLeaseId,
    error: mockDownloadError,
  }),
}));

describe("ChargeRegularizationSection", () => {
  beforeEach(() => {
    mockRegularizationData = null;
    mockIsLoading = false;
    mockCalculateMutate.mockClear();
    mockCalculateIsPending = false;
    mockCalculateIsError = false;
    mockCalculateIsSuccess = false;
    mockApplyMutate.mockClear();
    mockApplyIsPending = false;
    mockApplyIsError = false;
    mockSendMutate.mockClear();
    mockSendIsPending = false;
    mockSendIsError = false;
    mockSettleMutate.mockClear();
    mockSettleIsPending = false;
    mockSettleIsError = false;
    mockDownloadPdf.mockClear();
    mockIsDownloading = false;
    mockDownloadingLeaseId = null;
    mockDownloadError = null;
  });

  it("renders title with fiscal year", () => {
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText("Régularisation des charges — 2025"),
    ).toBeInTheDocument();
  });

  it("renders generate button", () => {
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByRole("button", { name: /Générer la régularisation/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockIsLoading = true;
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("shows empty state when no regularization", () => {
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText("Aucune régularisation calculée pour cet exercice."),
    ).toBeInTheDocument();
  });

  it("calls mutate after AlertDialog confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    // Click the trigger button to open the dialog
    await user.click(
      screen.getByRole("button", { name: /Générer la régularisation/i }),
    );

    // Confirm in the AlertDialog
    await user.click(
      screen.getByRole("button", { name: "Générer" }),
    );

    expect(mockCalculateMutate).toHaveBeenCalledWith({
      id: "entity-1-2025",
      fiscalYear: 2025,
    });
  });

  it("shows AlertDialog confirmation message", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    await user.click(
      screen.getByRole("button", { name: /Générer la régularisation/i }),
    );

    expect(
      screen.getByText(/Voulez-vous générer la régularisation/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cela remplacera les résultats existants/),
    ).toBeInTheDocument();
  });

  it("does not call mutate when AlertDialog is cancelled", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    await user.click(
      screen.getByRole("button", { name: /Générer la régularisation/i }),
    );

    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(mockCalculateMutate).not.toHaveBeenCalled();
  });

  it("shows error when calculation fails", () => {
    mockCalculateIsError = true;
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText(
        "Erreur lors du calcul de la régularisation. Veuillez réessayer.",
      ),
    ).toBeInTheDocument();
  });

  it("shows success message when calculated but data not yet reloaded", () => {
    mockCalculateIsSuccess = true;
    mockRegularizationData = null;
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText("Régularisation calculée. Rechargement en cours…"),
    ).toBeInTheDocument();
  });

  it("shows download error", () => {
    mockDownloadError = "Erreur de téléchargement";
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText("Erreur de téléchargement"),
    ).toBeInTheDocument();
  });

  it("renders statements when regularization data exists", () => {
    mockRegularizationData = {
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 8000,
      statements: [
        {
          leaseId: "lease-1",
          tenantId: "tenant-1",
          tenantName: "Dupont Jean",
          unitId: "unit-1",
          unitIdentifier: "Apt 1A",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    };
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(screen.getByText(/1 locataire/)).toBeInTheDocument();
    expect(screen.getByText("Dupont Jean — Apt 1A")).toBeInTheDocument();
  });

  it("shows empty statements message when regularization has no statements", () => {
    mockRegularizationData = {
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 0,
      statements: [],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    };
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByText("Aucun locataire à régulariser pour cet exercice."),
    ).toBeInTheDocument();
  });

  it("pluralizes locataire count", () => {
    mockRegularizationData = {
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 16000,
      statements: [
        {
          leaseId: "lease-1",
          tenantId: "tenant-1",
          tenantName: "Dupont Jean",
          unitId: "unit-1",
          unitIdentifier: "Apt 1A",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
        {
          leaseId: "lease-2",
          tenantId: "tenant-2",
          tenantName: "Martin Paul",
          unitId: "unit-2",
          unitIdentifier: "Apt 2B",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    };
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(screen.getByText(/2 locataires/)).toBeInTheDocument();
  });

  it("disables generate button while pending", () => {
    mockCalculateIsPending = true;
    renderWithProviders(
      <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
    );

    expect(
      screen.getByRole("button", { name: /Générer la régularisation/i }),
    ).toBeDisabled();
  });

  describe("apply regularization", () => {
    const makeRegularizationData = (appliedAt: string | null = null) => ({
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 8000,
      appliedAt,
      statements: [
        {
          leaseId: "lease-1",
          tenantId: "tenant-1",
          tenantName: "Dupont Jean",
          unitId: "unit-1",
          unitIdentifier: "Apt 1A",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    });

    it("renders Appliquer button when not yet applied", () => {
      mockRegularizationData = makeRegularizationData();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Appliquer/ }),
      ).toBeInTheDocument();
    });

    it("shows 'Déjà appliquée' badge when already applied", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z");
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(screen.getByText("Déjà appliquée")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Appliquer/ }),
      ).not.toBeInTheDocument();
    });

    it("calls applyMutation after AlertDialog confirmation", async () => {
      mockRegularizationData = makeRegularizationData();
      const user = userEvent.setup();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      await user.click(
        screen.getByRole("button", { name: /Appliquer/ }),
      );

      // AlertDialog should show
      expect(
        screen.getByText(/Appliquer la régularisation/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Cette action est irréversible/),
      ).toBeInTheDocument();

      // Confirm
      await user.click(
        screen.getByRole("button", { name: "Appliquer" }),
      );

      expect(mockApplyMutate).toHaveBeenCalled();
    });

    it("disables apply button while pending", () => {
      mockRegularizationData = makeRegularizationData();
      mockApplyIsPending = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Appliquer/ }),
      ).toBeDisabled();
    });

    it("shows error message when apply fails", () => {
      mockRegularizationData = makeRegularizationData();
      mockApplyIsError = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByText(
          /Erreur lors de l'application de la régularisation/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("send regularization", () => {
    const makeRegularizationData = (
      sentAt: string | null = null,
      appliedAt: string | null = null,
    ) => ({
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 8000,
      appliedAt,
      sentAt,
      settledAt: null,
      statements: [
        {
          leaseId: "lease-1",
          tenantId: "tenant-1",
          tenantName: "Dupont Jean",
          unitId: "unit-1",
          unitIdentifier: "Apt 1A",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    });

    it("renders 'Envoyer par email' button when not yet sent", () => {
      mockRegularizationData = makeRegularizationData();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Envoyer par email/ }),
      ).toBeInTheDocument();
    });

    it("shows 'Déjà envoyée' badge when already sent", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z");
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(screen.getByText("Déjà envoyée")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Envoyer par email/ }),
      ).not.toBeInTheDocument();
    });

    it("calls sendMutation after AlertDialog confirmation", async () => {
      mockRegularizationData = makeRegularizationData();
      const user = userEvent.setup();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      await user.click(
        screen.getByRole("button", { name: /Envoyer par email/ }),
      );

      // AlertDialog should show
      expect(
        screen.getByText(/Envoyer les décomptes par email/),
      ).toBeInTheDocument();

      // Confirm
      await user.click(
        screen.getByRole("button", { name: "Envoyer" }),
      );

      expect(mockSendMutate).toHaveBeenCalled();
    });

    it("disables send button while pending", () => {
      mockRegularizationData = makeRegularizationData();
      mockSendIsPending = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Envoyer par email/ }),
      ).toBeDisabled();
    });

    it("shows error message when send fails", () => {
      mockRegularizationData = makeRegularizationData();
      mockSendIsError = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByText(
          /Erreur lors de l'envoi des décomptes/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("settle regularization", () => {
    const makeRegularizationData = (
      appliedAt: string | null = null,
      settledAt: string | null = null,
      sentAt: string | null = null,
    ) => ({
      id: "reg-1",
      entityId: "entity-1",
      userId: "user-1",
      fiscalYear: 2025,
      totalBalanceCents: 8000,
      appliedAt,
      sentAt,
      settledAt,
      statements: [
        {
          leaseId: "lease-1",
          tenantId: "tenant-1",
          tenantName: "Dupont Jean",
          unitId: "unit-1",
          unitIdentifier: "Apt 1A",
          occupancyStart: "2025-01-01",
          occupancyEnd: "2025-12-31",
          occupiedDays: 365,
          daysInYear: 365,
          charges: [],
          totalShareCents: 50000,
          totalProvisionsPaidCents: 42000,
          balanceCents: 8000,
        },
      ],
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    });

    it("does not show settle button when not applied", () => {
      mockRegularizationData = makeRegularizationData();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.queryByRole("button", { name: /Marquer comme réglée/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Réglée"),
      ).not.toBeInTheDocument();
    });

    it("does not show settle button when applied but not sent", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z");
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.queryByRole("button", { name: /Marquer comme réglée/ }),
      ).not.toBeInTheDocument();
    });

    it("shows settle button when applied and sent but not settled", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z", null, "2025-01-25T10:00:00Z");
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Marquer comme réglée/ }),
      ).toBeInTheDocument();
    });

    it("shows 'Réglée' badge when settled", () => {
      mockRegularizationData = makeRegularizationData(
        "2025-01-20T10:00:00Z",
        "2025-02-01T10:00:00Z",
        "2025-01-25T10:00:00Z",
      );
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(screen.getByText("Réglée")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Marquer comme réglée/ }),
      ).not.toBeInTheDocument();
    });

    it("calls settleMutation after AlertDialog confirmation", async () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z", null, "2025-01-25T10:00:00Z");
      const user = userEvent.setup();
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      await user.click(
        screen.getByRole("button", { name: /Marquer comme réglée/ }),
      );

      expect(
        screen.getByText(/Confirmez-vous que la régularisation/),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Confirmer" }),
      );

      expect(mockSettleMutate).toHaveBeenCalled();
    });

    it("disables settle button while pending", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z", null, "2025-01-25T10:00:00Z");
      mockSettleIsPending = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByRole("button", { name: /Marquer comme réglée/ }),
      ).toBeDisabled();
    });

    it("shows error message when settle fails", () => {
      mockRegularizationData = makeRegularizationData("2025-01-20T10:00:00Z", null, "2025-01-25T10:00:00Z");
      mockSettleIsError = true;
      renderWithProviders(
        <ChargeRegularizationSection entityId="entity-1" fiscalYear={2025} />,
      );

      expect(
        screen.getByText(/Erreur lors du règlement/),
      ).toBeInTheDocument();
    });
  });
});
