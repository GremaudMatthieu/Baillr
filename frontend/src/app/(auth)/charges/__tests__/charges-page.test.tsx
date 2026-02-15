import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import ChargesPage from "../page";
import type { AnnualChargesData } from "@/lib/api/annual-charges-api";
import type { ChargeCategoryData } from "@/lib/api/charge-categories-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/charges",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

let mockEntityId: string | null = "entity-1";
let mockAnnualChargesData: AnnualChargesData | null | undefined = undefined;
let mockIsLoading = false;
let mockIsError = false;
let mockProvisionsData: null = null;
const mockMutate = vi.fn();
const mockDeleteMutate = vi.fn();
let mockIsDeleting = false;
let mockDeleteError: string | null = null;
const mockClearDeleteError = vi.fn();

const standardCategories: ChargeCategoryData[] = [
  { id: "cat-water", entityId: "entity-1", slug: "water", label: "Eau", isStandard: true, createdAt: "", updatedAt: "" },
  { id: "cat-electricity", entityId: "entity-1", slug: "electricity", label: "Électricité", isStandard: true, createdAt: "", updatedAt: "" },
  { id: "cat-teom", entityId: "entity-1", slug: "teom", label: "TEOM", isStandard: true, createdAt: "", updatedAt: "" },
  { id: "cat-cleaning", entityId: "entity-1", slug: "cleaning", label: "Nettoyage", isStandard: true, createdAt: "", updatedAt: "" },
];

let mockChargeCategories: ChargeCategoryData[] = [...standardCategories];

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => ({
    entityId: mockEntityId,
    entity: null,
    entities: [],
    setCurrentEntityId: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-annual-charges", () => ({
  useAnnualCharges: () => ({
    data: mockAnnualChargesData,
    isLoading: mockIsLoading,
    isError: mockIsError,
  }),
  useRecordAnnualCharges: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useProvisionsCollected: () => ({
    data: mockProvisionsData,
  }),
}));

vi.mock("@/hooks/use-charge-categories", () => ({
  useChargeCategories: () => ({
    data: mockChargeCategories,
    isLoading: false,
  }),
  useCreateChargeCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useDeleteChargeCategory: () => ({
    mutate: mockDeleteMutate,
    isPending: mockIsDeleting,
    deleteError: mockDeleteError,
    clearDeleteError: mockClearDeleteError,
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: () => ({
    data: [],
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-water-meter-readings", () => ({
  useWaterMeterReadings: () => ({
    data: null,
    isLoading: false,
  }),
  useRecordWaterMeterReadings: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useWaterDistribution: () => ({
    data: null,
  }),
}));

vi.mock("@/hooks/use-charge-regularization", () => ({
  useChargeRegularization: () => ({
    data: null,
    isLoading: false,
  }),
  useCalculateChargeRegularization: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
  }),
  useApplyChargeRegularization: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useSendChargeRegularization: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
  useSettleChargeRegularization: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-download-regularization-pdf", () => ({
  useDownloadRegularizationPdf: () => ({
    downloadPdf: vi.fn(),
    isDownloading: false,
    downloadingLeaseId: null,
    error: null,
  }),
}));

describe("ChargesPage", () => {
  beforeEach(() => {
    mockEntityId = "entity-1";
    mockAnnualChargesData = undefined;
    mockIsLoading = false;
    mockIsError = false;
    mockProvisionsData = null;
    mockChargeCategories = [...standardCategories];
    mockIsDeleting = false;
    mockDeleteError = null;
    mockMutate.mockClear();
    mockDeleteMutate.mockClear();
    mockClearDeleteError.mockClear();
  });

  it("should show no-entity state when no entity selected", () => {
    mockEntityId = null;
    renderWithProviders(<ChargesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Charges annuelles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Aucune entité sélectionnée"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Gérer mes entités/i }),
    ).toHaveAttribute("href", "/entities");
  });

  it("should show loading state", () => {
    mockIsLoading = true;
    renderWithProviders(<ChargesPage />);

    expect(screen.getByText("Chargement…")).toBeInTheDocument();
  });

  it("should show error state", () => {
    mockIsError = true;
    renderWithProviders(<ChargesPage />);

    expect(
      screen.getByText("Erreur lors du chargement des charges."),
    ).toBeInTheDocument();
  });

  it("should render page title", () => {
    renderWithProviders(<ChargesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Charges annuelles" }),
    ).toBeInTheDocument();
  });

  it("should render year selector", () => {
    renderWithProviders(<ChargesPage />);

    expect(
      screen.getByRole("combobox", { name: "Exercice fiscal" }),
    ).toBeInTheDocument();
  });

  it("should show form when data loaded", () => {
    mockAnnualChargesData = null;
    mockIsLoading = false;
    mockIsError = false;
    renderWithProviders(<ChargesPage />);

    // Form should render since it's not loading and no error
    expect(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    ).toBeInTheDocument();
  });

  it("should display comparison card", () => {
    renderWithProviders(<ChargesPage />);

    const currentYear = new Date().getFullYear() - 1;
    expect(
      screen.getByText(`Charges réelles — Exercice ${currentYear}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Comparaison charges / provisions — ${currentYear}`,
      ),
    ).toBeInTheDocument();
  });

  describe("charge category deletion", () => {
    const customCategory: ChargeCategoryData = {
      id: "cat-custom",
      entityId: "entity-1",
      slug: "custom",
      label: "Ma catégorie",
      isStandard: false,
      createdAt: "",
      updatedAt: "",
    };

    it("should not show custom categories card when only standard categories exist", () => {
      mockChargeCategories = [...standardCategories];
      renderWithProviders(<ChargesPage />);

      expect(
        screen.queryByText("Catégories personnalisées"),
      ).not.toBeInTheDocument();
    });

    it("should show custom categories card when custom categories exist", () => {
      mockChargeCategories = [...standardCategories, customCategory];
      renderWithProviders(<ChargesPage />);

      expect(
        screen.getByText("Catégories personnalisées"),
      ).toBeInTheDocument();
      // The label appears in the list item and possibly in Radix Select options
      expect(
        screen.getByRole("button", { name: "Supprimer Ma catégorie" }),
      ).toBeInTheDocument();
    });

    it("should show delete button for custom categories", () => {
      mockChargeCategories = [...standardCategories, customCategory];
      renderWithProviders(<ChargesPage />);

      expect(
        screen.getByRole("button", { name: "Supprimer Ma catégorie" }),
      ).toBeInTheDocument();
    });

    it("should show confirmation dialog when delete button clicked", async () => {
      const user = userEvent.setup();
      mockChargeCategories = [...standardCategories, customCategory];
      renderWithProviders(<ChargesPage />);

      await user.click(
        screen.getByRole("button", { name: "Supprimer Ma catégorie" }),
      );

      expect(
        screen.getByText("Supprimer la catégorie"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Cette action est irréversible/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Annuler" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Supprimer" }),
      ).toBeInTheDocument();
    });

    it("should call deleteCategory on confirmation", async () => {
      const user = userEvent.setup();
      mockChargeCategories = [...standardCategories, customCategory];
      renderWithProviders(<ChargesPage />);

      await user.click(
        screen.getByRole("button", { name: "Supprimer Ma catégorie" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Supprimer" }),
      );

      expect(mockClearDeleteError).toHaveBeenCalled();
      expect(mockDeleteMutate).toHaveBeenCalledWith("cat-custom");
    });

    it("should display error message when delete fails", () => {
      mockChargeCategories = [...standardCategories, customCategory];
      mockDeleteError = "Cette catégorie est utilisée par 3 baux";
      renderWithProviders(<ChargesPage />);

      expect(
        screen.getByText("Cette catégorie est utilisée par 3 baux"),
      ).toBeInTheDocument();
    });

    it("should disable delete buttons while deleting", () => {
      mockChargeCategories = [...standardCategories, customCategory];
      mockIsDeleting = true;
      renderWithProviders(<ChargesPage />);

      expect(
        screen.getByRole("button", { name: "Supprimer Ma catégorie" }),
      ).toBeDisabled();
    });
  });
});
