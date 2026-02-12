import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { LeaseDetailContent } from "../lease-detail-content";
import type { LeaseData } from "@/lib/api/leases-api";

const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/leases/lease-1",
  useParams: () => ({ id: "lease-1" }),
  useSearchParams: () => new URLSearchParams(),
}));

const baseLease: LeaseData = {
  id: "lease-1",
  entityId: "entity-1",
  userId: "user_test",
  tenantId: "tenant-1",
  unitId: "unit-1",
  startDate: "2026-03-01T00:00:00.000Z",
  rentAmountCents: 63000,
  securityDepositCents: 63000,
  monthlyDueDate: 5,
  revisionIndexType: "IRL",
  billingLines: [],
  revisionDay: null,
  revisionMonth: null,
  referenceQuarter: null,
  referenceYear: null,
  baseIndexValue: null,
  endDate: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const leaseWithRevision: LeaseData = {
  ...baseLease,
  revisionDay: 15,
  revisionMonth: 3,
  referenceQuarter: "Q2",
  referenceYear: 2025,
  baseIndexValue: 142.06,
};

let mockLeaseData: LeaseData | undefined;
let mockLeaseLoading = false;
let mockLeaseError = false;
const mockConfigureMutate = vi.fn();
const mockConfigureBillingMutate = vi.fn();
const mockTerminateMutate = vi.fn();

vi.mock("@/hooks/use-leases", () => ({
  useLease: () => ({
    data: mockLeaseData,
    isLoading: mockLeaseLoading,
    isError: mockLeaseError,
  }),
  useConfigureBillingLines: () => ({
    mutate: mockConfigureBillingMutate,
    isPending: false,
  }),
  useConfigureRevisionParameters: () => ({
    mutate: mockConfigureMutate,
    isPending: false,
  }),
  useTerminateLease: () => ({
    mutate: mockTerminateMutate,
    isPending: false,
    error: null,
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useUnit: () => ({
    data: {
      id: "unit-1",
      name: "Appartement T3",
      type: "apartment",
      billableOptions: [],
    },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenant: () => ({
    data: {
      id: "tenant-1",
      firstName: "Jean",
      lastName: "Dupont",
    },
    isLoading: false,
  }),
}));

describe("LeaseDetailContent — Revision Parameters", () => {
  beforeEach(() => {
    mockLeaseData = undefined;
    mockLeaseLoading = false;
    mockLeaseError = false;
    mockConfigureMutate.mockReset();
  });

  it("should show configure prompt when revision parameters not set", () => {
    mockLeaseData = baseLease;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.getByText("Paramètres de révision"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Configurer les paramètres de révision"),
    ).toBeInTheDocument();
    const configButtons = screen.getAllByRole("button", {
      name: /Configurer/i,
    });
    expect(configButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should display revision parameters when configured", () => {
    mockLeaseData = leaseWithRevision;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Date de révision annuelle")).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
    expect(screen.getByText(/Mars/)).toBeInTheDocument();
    expect(screen.getByText("Trimestre de référence")).toBeInTheDocument();
    expect(screen.getByText(/T2 \(Avril-Juin\)/)).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
    expect(screen.getByText("Indice de base")).toBeInTheDocument();
    expect(screen.getByText("142.06")).toBeInTheDocument();
  });

  it("should show 'Non renseigné' when base index is null", () => {
    mockLeaseData = {
      ...leaseWithRevision,
      baseIndexValue: null,
    };
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Non renseigné")).toBeInTheDocument();
  });

  it("should show Modifier button when revision parameters are configured", () => {
    mockLeaseData = leaseWithRevision;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(
      screen.getByRole("button", { name: /Modifier/i }),
    ).toBeInTheDocument();
  });

  it("should open revision parameters form when Configurer is clicked", async () => {
    const user = userEvent.setup();
    mockLeaseData = baseLease;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    // Click the "Configurer" button in the revision parameters empty state
    // (not the "Configurer les lignes" button from billing section)
    const configureButton = screen.getByRole("button", {
      name: "Configurer",
    });
    await user.click(configureButton);

    expect(screen.getByText("Jour de révision")).toBeInTheDocument();
    expect(screen.getByText("Mois de révision")).toBeInTheDocument();
    expect(screen.getByText("Trimestre de référence")).toBeInTheDocument();
    expect(screen.getByLabelText("Année de référence")).toBeInTheDocument();
    expect(screen.getByText("Annuler")).toBeInTheDocument();
    expect(screen.getByText("Enregistrer")).toBeInTheDocument();
  });

  it("should close form when Annuler is clicked", async () => {
    const user = userEvent.setup();
    mockLeaseData = baseLease;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    const configureButton = screen.getByRole("button", {
      name: "Configurer",
    });
    await user.click(configureButton);
    expect(screen.getByText("Jour de révision")).toBeInTheDocument();

    await user.click(screen.getByText("Annuler"));

    await waitFor(() => {
      expect(
        screen.getByText("Configurer les paramètres de révision"),
      ).toBeInTheDocument();
    });
  });
});

describe("LeaseDetailContent — Termination", () => {
  beforeEach(() => {
    mockLeaseData = undefined;
    mockLeaseLoading = false;
    mockLeaseError = false;
    mockTerminateMutate.mockReset();
  });

  it("should show Résiliation section when lease is active", () => {
    mockLeaseData = baseLease;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Résiliation")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Résilier ce bail/i }),
    ).toBeInTheDocument();
  });

  it("should show end date in Résiliation section when lease is terminated", () => {
    mockLeaseData = { ...baseLease, endDate: "2026-06-15T00:00:00.000Z" };
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Résiliation")).toBeInTheDocument();
    expect(screen.getByText("Date de fin")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Résilier ce bail/i })).not.toBeInTheDocument();
  });

  it("should show Résilié badge when lease is terminated", () => {
    mockLeaseData = { ...baseLease, endDate: "2026-06-15T00:00:00.000Z" };
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    const badges = screen.getAllByText("Résilié");
    expect(badges).toHaveLength(2); // header badge + Résiliation section badge
  });

  it("should show end date when lease is terminated", () => {
    mockLeaseData = { ...baseLease, endDate: "2026-06-15T00:00:00.000Z" };
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    expect(screen.getByText("Date de fin")).toBeInTheDocument();
  });

  it("should open terminate dialog when button is clicked", async () => {
    const user = userEvent.setup();
    mockLeaseData = baseLease;
    renderWithProviders(<LeaseDetailContent leaseId="lease-1" />);

    await user.click(
      screen.getByRole("button", { name: /Résilier ce bail/i }),
    );

    expect(screen.getByLabelText("Date de fin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Résilier" }),
    ).toBeInTheDocument();
  });
});
