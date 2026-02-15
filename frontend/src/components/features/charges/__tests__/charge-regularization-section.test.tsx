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
});
