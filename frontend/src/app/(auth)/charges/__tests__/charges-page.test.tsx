import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import ChargesPage from "../page";
import type { AnnualChargesData } from "@/lib/api/annual-charges-api";

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
    data: [
      { id: "cat-water", entityId: "entity-1", slug: "water", label: "Eau", isStandard: true, createdAt: "", updatedAt: "" },
      { id: "cat-electricity", entityId: "entity-1", slug: "electricity", label: "Électricité", isStandard: true, createdAt: "", updatedAt: "" },
      { id: "cat-teom", entityId: "entity-1", slug: "teom", label: "TEOM", isStandard: true, createdAt: "", updatedAt: "" },
      { id: "cat-cleaning", entityId: "entity-1", slug: "cleaning", label: "Nettoyage", isStandard: true, createdAt: "", updatedAt: "" },
    ],
    isLoading: false,
  }),
  useCreateChargeCategory: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
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

describe("ChargesPage", () => {
  beforeEach(() => {
    mockEntityId = "entity-1";
    mockAnnualChargesData = undefined;
    mockIsLoading = false;
    mockIsError = false;
    mockProvisionsData = null;
    mockMutate.mockClear();
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
});
