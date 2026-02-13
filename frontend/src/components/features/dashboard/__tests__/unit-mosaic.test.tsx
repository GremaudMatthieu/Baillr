import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { UnitMosaic } from "../unit-mosaic";
import type { UnitWithPropertyData } from "@/lib/api/units-api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockUseEntityUnits = vi.fn();

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: (...args: unknown[]) => mockUseEntityUnits(...args),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: [] }),
}));

const mockUnits: UnitWithPropertyData[] = [
  {
    id: "unit-1",
    propertyId: "prop-1",
    propertyName: "Résidence Les Pins",
    userId: "user_test123",
    identifier: "Apt 101",
    type: "apartment",
    floor: 1,
    surfaceArea: 45.5,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "unit-2",
    propertyId: "prop-1",
    propertyName: "Résidence Les Pins",
    userId: "user_test123",
    identifier: "Parking P01",
    type: "parking",
    floor: null,
    surfaceArea: 0,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "unit-3",
    propertyId: "prop-2",
    propertyName: "Résidence Les Chênes",
    userId: "user_test123",
    identifier: "Commerce 1",
    type: "commercial",
    floor: 0,
    surfaceArea: 120,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

describe("UnitMosaic", () => {
  it("should display skeleton during loading", () => {
    mockUseEntityUnits.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    // Skeleton has no text content but should be rendered
    expect(screen.queryByText("Aucun lot configure")).not.toBeInTheDocument();
  });

  it("should display error state", () => {
    mockUseEntityUnits.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(
      screen.getByText("Impossible de charger les lots"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should display empty state when no units", () => {
    mockUseEntityUnits.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(screen.getByText("Aucun lot configure")).toBeInTheDocument();
  });

  it("should group units by property name", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(screen.getByText("Résidence Les Pins")).toBeInTheDocument();
    expect(screen.getByText("Résidence Les Chênes")).toBeInTheDocument();
  });

  it("should display unit identifiers", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(screen.getByText("Apt 101")).toBeInTheDocument();
    expect(screen.getByText("Parking P01")).toBeInTheDocument();
    expect(screen.getByText("Commerce 1")).toBeInTheDocument();
  });

  it("should display unit type badges", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(screen.getByText("Appartement")).toBeInTheDocument();
    expect(screen.getByText("Parking")).toBeInTheDocument();
    expect(screen.getByText("Local commercial")).toBeInTheDocument();
  });

  it("should display floor and surface for apartment", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(screen.getByText("Etage 1 · 45.5 m²")).toBeInTheDocument();
  });

  it("should not display surface 0 for parking", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    // Parking with surfaceArea=0 should show empty string (no floor, no surface)
    expect(screen.queryByText("0 m²")).not.toBeInTheDocument();
  });

  it("should navigate on unit tile click", async () => {
    const user = userEvent.setup();
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    await user.click(screen.getByText("Apt 101"));
    expect(mockPush).toHaveBeenCalledWith("/properties/prop-1/units/unit-1");
  });

  it("should render grid with ARIA role", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(
      screen.getByRole("grid", { name: "Mosaique des lots" }),
    ).toBeInTheDocument();
  });

  it("should have accessible labels on unit tiles", () => {
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);
    expect(
      screen.getByRole("gridcell", { name: /Apt 101.*Appartement/i }),
    ).toBeInTheDocument();
  });

  it("should support keyboard navigation", async () => {
    const user = userEvent.setup();
    mockUseEntityUnits.mockReturnValue({
      data: mockUnits,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // Focus the first tile
    const firstTile = screen.getByRole("gridcell", { name: /Apt 101/i });
    firstTile.focus();

    // Navigate right
    await user.keyboard("{ArrowRight}");
    const secondTile = screen.getByRole("gridcell", { name: /Parking P01/i });
    expect(secondTile).toHaveFocus();
  });
});
